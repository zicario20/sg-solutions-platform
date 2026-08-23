# Module PRD — M011 Portal de documentos

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Provider-disabled secure-core implementation ready for Product Owner acceptance; not deployed or operational
- Surface: Client Portal `/client/documents` and
  `/client/services/[publicServiceRef]/documents`; Admin `/admin/documents` and case-scoped views
- Workstream: R1.5 Client Portal & Launch
- Release target: Release 1A secure document core with compatible Release 1B extensions
- Source: complete Product Owner-supplied M011 corpus, normalized to the approved stack
- Related catalog modules: M011; consumes M007–M010/M014/M018–M019/M021–M023/M025–M026/M065–M067/M077–M085/M098
- Proposed ADR: ADR 015

This PRD defines SG Solutions' single document capability inside the modular monolith. It does not
authorize product code, routes, schema, RLS or Storage policies, scanner/OCR/signature providers,
real client files, merge, deployment or `GENERATE`.

## 1. Purpose

Give clients and explicitly authorized staff one secure, traceable place to request, upload,
review, replace and deliver documents associated with real SG Solutions services and cases.

A document is a governed domain resource, not an object-storage path. It has an owner/context,
purpose, type, classification, visibility, immutable versions, review state, retention policy,
authorization evidence and audit history. M011 is the canonical owner of document requests,
document metadata, versions, upload safety state, client-visible review results and authorized
delivery. Supabase Storage holds private bytes; Postgres holds operational authority.

## 2. Business value

- Replace ad-hoc email and messaging attachments with a safer client collaboration path.
- Tell clients exactly what is needed, what was received, what needs correction and what is ready.
- Preserve evidence and prior versions without silent overwrite.
- Give staff reliable case-linked documents without a generic shared-drive permission model.
- Reduce malware, BOLA/IDOR, public-link, metadata and accidental-internal-note exposure risks.
- Create durable boundaries for future OCR, extraction, generation, signature and partner sharing.
- Support retention, legal hold, deletion, recovery and incident response from the first real-client
  release.
- Reuse one document primitive across all service verticals instead of duplicating tax, credit,
  funding, business-formation or home-buying upload systems.

## 3. Scope

### Release 1A architecture

- A top-level authorized document landing plus service/case-scoped document views.
- Staff-created versioned document requests/checklists tied to real ServiceOrder/CaseFile context.
- Direct private uploads into an isolated quarantine boundary through bounded server-authorized
  upload intents.
- Content-based type, actual-size, parser/integrity, encrypted-file and malware validation.
- SHA-256 integrity evidence and duplicate hints scoped so no cross-client existence signal leaks.
- One logical `Document` with immutable `DocumentVersion` lineage and no in-place byte overwrite.
- Separate safety, operational-review, visibility and retention/hold state axes.
- Staff receipt/review, approved correction reasons, replacement and explicit request satisfaction.
- Client-safe metadata, status, instructions and recovery actions; no internal comments or storage
  identifiers.
- Authorized preview/download using short-lived, single-object access after fresh domain/RLS checks.
- Explicit document-to-case/service/request links without duplicating bytes merely for navigation.
- Private/no-store client projections, minimized audit events and staff sensitive-access evidence.
- Idempotent, retry-bounded scan/promotion/orphan/retention coordination with manual recovery.
- Bilingual WCAG 2.2 AA responsive experience, including keyboard/file-picker and mobile-camera
  guidance.
- Secure deletion/tombstone and legal-hold hooks whose exact periods/authority remain gated.
- Manual review and upload recovery when optional automation is unavailable.

### Compatible Release 1B extensions

- Approved resumable and multi-file upload policies over the same upload-intent/state contract.
- Expanded allowlisted formats after parser, conversion and threat review.
- Richer metadata search and service-specific checklist templates without indexing protected bytes.
- M065 OCR/extraction/quality suggestions with redaction, provenance and human verification.
- M066 versioned generation templates, review evidence and final-deliverable promotion.
- M067 electronic-signature requests, evidence and immutable completed artifacts.
- Approved temporary third-party upload and partner-sharing workflows with purpose/consent scope.
- Approved channel ingestion from M004/M012/email adapters into the same quarantine lifecycle.
- Operational metrics and governed notifications without document names, content or sensitive data.

Release 1A uses the durable identifiers, state axes, authorization model, storage abstraction,
checksums, version lineage and audit vocabulary that later releases extend. A disposable upload
bucket or second document database is prohibited.

## 4. Explicit out of scope

- Public file hosting, public buckets, permanent signed URLs or bucket/folder browsing.
- A second storage authority, MinIO deployment or migration away from approved Supabase Storage.
- Treating an original filename, email, client record, CRM relation, payment or opaque reference as
  authorization.
- Public/prospect upload links, partner sharing or cross-channel ingestion before their policies are
  approved.
- Release 1A Office, HEIC, archive, executable, HTML, SVG, encrypted/password-protected or unknown
  file acceptance.
- Arbitrary ZIP/archive extraction, macro execution, embedded-file execution or server-side active
  content rendering.
- Automatic acceptance because a malware scan is clean, or task/request completion because bytes
  were uploaded.
- OCR/extracted text as truth, automatic case-field mutation, unrestricted full-text indexing or
  RAG ingestion.
- M065 processing, M066 document generation or M067 electronic-signature workflow implementation.
- AI access to a bucket, global document corpus, unredacted client content or model training.
- Client access to internal workpapers, review notes, compliance comments, rejected internal drafts,
  audit records or other clients/contexts.
- Editing a signed/final immutable version, silently replacing bytes or deleting evidence against
  retention/legal hold.
- Sending sensitive attachments through email, public chat, WhatsApp or analytics as the
  authoritative workflow.
- Final format/size/page/quota, retention, legal-hold, review, sharing, analytics, notification or
  provider policy without Product Owner approval.

## 5. Actors

### Authorized client

Has a valid M007 application session/membership and an explicit active grant to the governing case
or a direct document grant. May see only client-visible requests/documents/versions allowed by the
current context, assurance and policy.

### Authorized representative

May later act within an approved personal, household or business context. A representative,
participant or business relationship describes involvement but grants nothing by itself.

### Owner or authorized specialist

May create requests, review safe accepted bytes, issue client-visible correction reasons, approve
deliverables and link documents within permitted cases. Role permission without resource scope is
insufficient.

### Compliance Reviewer

May review classification, access, retention and legal-hold evidence within an approved role and
resource scope. This actor does not automatically receive universal document access.

### Uploading third party

Future actor limited to one separately approved, expiring, purpose-bound request. It receives no
portal membership, list/read access or capability beyond its upload intent.

### System worker

Processes one authorized upload/version through a scoped service identity. It has no broad client
browsing privilege and cannot change business review state merely from an automated verdict.

### AI or document-processing agent

Future M065/M066 actor using narrow tools and minimum necessary redacted/authorized content. It
never receives raw bucket credentials, global search or authority to validate identity, law,
signature, tax accuracy or evidentiary sufficiency.

## 6. User journeys

### 6.1 Client fulfills a request

1. The client opens `/client/documents` under a fresh M007 context.
2. The server returns only authorized, client-visible requests and documents.
3. The client chooses one request and receives approved bilingual type/size/quality guidance.
4. The server authorizes the actor, context, request, classification and limits, then creates one
   expiring quarantine upload intent.
5. The selected bytes upload directly to the exact private quarantine object.
6. Finalization verifies intent/object binding and records a durable quarantined attempt.
7. Validation, checksum and scan run idempotently; only a clean supported object promotes.
8. The client sees `received/processing` or a safe rejection/recovery result, never scanner detail.
9. Staff reviews the promoted immutable version and explicitly accepts it or requests correction.
10. Request/task completion occurs only through the owning approved rule after review.

### 6.2 Client replaces a document

1. The client opens an authorized correction request.
2. A new upload intent binds the same logical document/request and expected current version.
3. New bytes become a distinct immutable version and pass the full quarantine pipeline.
4. A compare-and-set operation advances the current eligible version only if grants, request,
   lineage and expected version still match.
5. The prior version remains superseded and inaccessible or visible only according to policy; it is
   never overwritten.

### 6.3 Staff reviews and publishes an approved deliverable

1. Staff enters the case-scoped document view with role, resource and assurance authorization.
2. Only safety-clean promoted versions can be previewed or reviewed.
3. Staff records a structured review decision and separate internal/client-visible comment.
4. A client-visible/final deliverable requires explicit visibility, an operational-review-accepted
   immutable version and a permitted case/service link; a safety-clean verdict alone is
   insufficient, and a draft is never published by filename or storage movement alone.
5. The client reauthorizes and receives a bounded preview/download handoff.

### 6.4 Safe failure and recovery

- Upload interruption keeps an attempt pending/expired without claiming receipt.
- Scanner unavailable or timed out keeps bytes quarantined and creates an operations task.
- Promotion uncertainty stays non-downloadable until reconciliation proves object and metadata.
- OCR/signature/AI unavailable never blocks the secure upload/review core.
- Revoked access makes list/detail/download return a normalized non-enumerating response.
- Storage/metadata disagreement creates a quarantined recovery case; no object is guessed clean.

## 7. States and transitions

M011 separates state axes so one fact cannot overwrite another.

### Upload attempt

Successful path: `authorized → uploading → uploaded_to_quarantine → finalizing →
queued_for_validation`.

Only an unconsumed pre-finalize attempt may transition from `authorized|uploading` to
`expired|abandoned`. Once finalization consumes the intent or queues validation, expiry/abandonment
cleanup cannot target those bytes; safety/promotion/reconciliation owns every later outcome.

Only the server may finalize. A client progress bar is not durable receipt evidence.

### Safety verdict

`pending → validating → scanning → clean|malicious|unsupported|encrypted|corrupt|scan_failed|timed_out`

Only `clean` may proceed to promotion. No business approval follows automatically.

### Storage promotion

`quarantine_only → promoting → promoted|promotion_uncertain|promotion_failed`

Quarantine-object disposition is a separate axis: `present → deletion_scheduled → deleted`.
Cleanup of the source after successful promotion never erases the durable `promoted` fact. Both
axes and the accepted-tier inventory/checksum reconcile independently.

Accepted/private-storage metadata and object inventory must agree before normal read access.

### Operational review

`received → under_review → accepted|needs_correction|rejected`

`waived` applies only to a request, never to a document version or unsafe bytes. A replacement
returns the new version to `received` while preserving prior decisions.

### Logical document lifecycle

`active → archived → deletion_scheduled → tombstoned → purged`

`legal_hold` is an orthogonal constraint, not a lifecycle value; it blocks disallowed disposition
without making unsafe or internal content visible.

### Visibility

`internal` is the default. `client_visible` or `shared_external` requires a deliberate authorized
transition and version binding. Visibility never derives from storage bucket location.

### Document request

`draft → requested → upload_pending → received → under_review → satisfied|needs_correction|
waived|expired|cancelled`

Exact public labels/transitions remain DOC-002/DOC-003 decisions. The durable contract preserves
upload, safety, review, request, lifecycle and hold as separate facts.

## 8. Business rules

1. One logical document may have many immutable versions; bytes are never overwritten in place.
2. One version has exactly one normalized storage object per storage tier; retries use idempotency
   and do not create silently competing current versions.
3. Postgres is operational authority for metadata/state; private Supabase Storage is byte storage.
   Storage existence is never authorization or proof of acceptance.
4. Release 1A defaults to content-validated PDF/JPEG/PNG up to 25 MiB, subject to DOC-001 approval.
5. Original filenames are protected display metadata, never storage keys, routes, logs or access
   controls. Client display requires an approved field policy.
6. A clean scanner verdict means only that the approved scanner found no known threat; it does not
   prove authenticity, completeness, validity or suitability.
7. Receipt means durable bytes/metadata entered the governed lifecycle. It is not operational
   acceptance, case completion or legal approval.
8. Uploading does not automatically satisfy a request or task when review is required.
9. Cross-client checksum matches never affect client-visible behavior. Duplicate detection is
   scoped to an already-authorized case/client context.
10. A document may link to multiple authorized cases/services through explicit `DocumentContextLink`
    records; each context authorizes independently, and no bytes are copied solely for navigation.
11. A context link does not transfer grants, lower classification/visibility or bypass a direct
    deny merely because it exists. Any new audience derives only from the explicitly approved
    target link plus that target's current grants, visibility rule, classification and assurance.
    Release 1A links remain inside one canonical client/data-owner boundary; cross-client,
    household or business-boundary reuse is disabled until DOC-010 explicitly approves its model.
    Link/unlink authorizes the actor against both the document and target context, validates direct
    denies/classification/assurance, commits by expected-version compare-and-set, advances the
    authorization epoch and returns normalized non-existence on either unauthorized side.
12. Internal/comment/compliance visibility is selected from separate structured fields; internal
    free text can never be copied into the client DTO by fallback.
13. A final/signed artifact is immutable; corrections create a new governed successor and preserve
    provenance.
14. Inngest coordinates retries/jobs only. Postgres state, expected versions and outbox evidence
    remain durable authority.
15. OCR, extraction, classification, generation and AI outputs are suggestions/evidence under their
    owning modules and never silently mutate authoritative case fields.
16. Retention/legal hold may deny delete but never grants read. Deletion and backup expiry follow
    the approved policy; no period is invented here.
17. Every sensitive staff preview/download and every classification/reclassification, context
    link/unlink, visibility/client-visible-version, share, hold or delete change is audited with
    minimized metadata and a durable outbox fact.
18. The portal is preferred for sensitive documents; other channels can only hand off through a
    separately approved adapter into the identical quarantine lifecycle.
19. Every artifact containing new bytes—upload, conversion, OCR/redaction derivative, generated
    document or signature-provider return—receives its own immutable locator/version, provenance,
    checksum, content-based MIME/parser validation, scanner verdict under a versioned policy and
    proven promotion before preview, delivery, signature or downstream use. Provider evidence or
    a predecessor's clean verdict never substitutes for these controls.
20. A new/replacement/derived version starts at the maximum applicable document default, linked-
    purpose and source-version classification/assurance. A link, replacement or transformation
    cannot downgrade it. Reclassification—especially downgrade—requires exact target authority,
    policy evidence, expected-version CAS, authorization-epoch invalidation and minimized audit/
    outbox evidence; absent proof it fails closed at the higher class. Link/unlink, replacement and
    reclassification atomically recompute the logical document's effective ceiling from every
    retained governed version and active linked purpose. Any decrease requires complete policy
    evidence and explicit reclassification in the same CAS transaction; unlink alone never lowers
    the ceiling and no intermediate lower-class window is permitted.

## 9. Authorization rules

### Required decision inputs

Every list/detail/upload/replace/preview/download/review/classify/reclassify/set-visibility/
set-client-visible-version/link/unlink/share/disposition command derives a fresh server-side
authorization snapshot containing:

- identity, application session/family, account and membership status;
- active personal/household/business context;
- role permissions and security-policy version;
- explicit case/service/document grants and direct denies;
- document/request/context link, `client_visible`, `inheritance_blocked` and classification;
- required assurance/step-up, trusted server time and retention/legal-hold constraints;
- resource and version epochs plus expected command version.

Membership, email, phone, CRM relationship, participant state, payment, entitlement, route
reference, object key, checksum or signed URL grants no document access.

### Inheritance and direct grants

- An explicit active case grant may inherit to an ordinary client-visible document linked to that
  case under ADR 004.
- Internal, compliance-only, staff draft and inheritance-blocked resources never inherit.
- Highly Sensitive categories may require an additional explicit document grant and step-up under
  DOC-005; until approved, they fail closed when ordinary inheritance is insufficient.
- Multi-context documents must have at least one independently authorized visible link for the
  requested operation. Links to other cases/clients remain undisclosed.

### Enforcement

- Domain services authorize before object I/O. Restricted Postgres RLS and private Storage policy
  provide defense in depth; user paths never use `service_role`, owner or `BYPASSRLS`.
- Storage clients cannot list a bucket or derive keys. A server service mints one bounded upload or
  read operation only after domain authorization.
- Immediately before returning metadata/capability, a final fence rechecks session/grant/context,
  document/version parent links, visibility, classification/assurance, retention/hold/deletion and
  expected version. Any change discards the whole response.
- Every page/cursor reauthorizes; cursors and public references are locators, never capabilities.
- Review, visibility, sharing, legal hold and destructive actions require their exact role/resource
  permission and enhanced audit. Sensitive actions may require independent approval when policy
  says so.

## 10. Data requirements

### Canonical aggregates

`DocumentRequest`

- opaque internal ID and non-enumerable public reference;
- governing client/context, ServiceOrder, CaseFile and approved checklist/template version;
- document type/purpose, required flag, due date, instructions and public-copy key;
- requested classification, allowed upload policy/version and request state/version;
- created/requested/satisfied/waived/cancelled actors and times.

`QuarantineUploadIntent`

- one-use opaque correlation, actor/session/context/request binding and expiration;
- allowed validated types, bytes/pages/count constraints and policy version;
- expected document/current-version lineage and object locator known only server-side;
- state/version, declared metadata digest, provider receipt/evidence and consumed/revoked time.

`Document`

- opaque ID/public reference, type/category/purpose, default classification and effective
  classification ceiling across retained versions/linked purposes, plus default visibility;
- logical owner and current approved context links;
- current promoted/reviewed/client-visible version pointers kept distinct;
- request relation, lifecycle/version, retention policy and legal-hold summary;
- creator/source-channel and timestamps without byte content.

`DocumentVersion`

- document/version number/lineage, immutable storage-object reference and tier;
- protected original filename, normalized validated MIME/extension, bytes/pages/dimensions;
- SHA-256, parser/scanner/provider/version/verdict and sanitized metadata evidence;
- effective classification, classification-policy version and bounded evidence references;
- safety, promotion, review and visibility states with expected versions;
- creator/source, created/replaced/superseded timestamps and tombstone/purge evidence.

`DocumentContextLink`

- document, client/context, ServiceOrder/CaseFile/request/task/communication relation;
- optional typed billing/payment reference owned by M014 and signature request/evidence/artifact
  reference owned by M067; each reference is metadata linkage only and transfers neither financial,
  signature nor document authority;
- optional partner relation only after the separate external-sharing decision and activation gate;
- purpose, visibility/inheritance flag, created/revoked actor/time and authorization epoch.

`DocumentReview`

- exact immutable version, structured decision/reason code and policy version;
- client-visible copy key/comment kept separately from internal/compliance-only text;
- reviewer, expected version, reviewed time and supersession link.

`DocumentAuditProfile` (an M077 `AuditEvent` profile, not a parallel audit table)

- opaque document/version/context/actor references, operation, result/reason category;
- policy/assurance/grant/resource epochs, correlation and trusted time;
- never bytes, extracted text, original filename, signed URL or protected field values.

### Storage and classification

- Bytes never enter Postgres, logs, analytics, source control, Sanity or error reports.
- Keys contain opaque generated segments and normalized server-derived extension only; no name,
  email, client/business identifier, SSN, case title or original filename.
- Quarantine and accepted/private objects use separate buckets or equivalently isolated policy
  boundaries under ADR 003.
- Data classification follows `DATA_CLASSIFICATION.md`; tax returns, credit reports, government IDs,
  bank/income/debt evidence and identity artifacts are Highly Sensitive.
- Original filenames and extraction text are at least Confidential and may inherit Highly Sensitive.

### Index/search limits

Release 1A indexes authorized metadata codes, opaque references, safe service/case bindings and
dates/statuses needed for operations. It does not full-text index document bytes, OCR text, account
numbers, SSN/ITIN, filenames or protected extracted fields. Encrypted fields obey ADR 005.

## 11. API or service contracts

All contracts are conceptual domain/service boundaries inside `apps/app` and packages; they do not
authorize endpoints.

```text
ClientDocumentQueryService.list(actor, context, filters, opaqueCursor?)
  -> AuthorizedDocumentPage

ClientDocumentQueryService.get(actor, publicDocumentRef, context)
  -> ClientDocumentDetail

StaffDocumentQueryService.list(actor, authorizedScope, filters, opaqueCursor?)
  -> AuthorizedStaffDocumentPage

StaffDocumentQueryService.get(actor, publicDocumentRef, authorizedContext)
  -> AuthorizedStaffDocumentDetail

DocumentRequestService.create|publish|cancel|waive|markSatisfied(command, expectedVersion)
  -> DocumentRequestResult

UploadIntentService.authorize(actor, context, requestRef, declaredMetadata, expectedVersion)
  -> BoundedQuarantineUploadIntent

UploadIntentService.finalize(actor, intentRef, providerReceipt, expectedVersion)
  -> UploadReceipt

UploadProcessingService.validateAndScan(uploadRef, idempotencyKey, expectedVersion)
  -> SafetyResult

DocumentPromotionService.promote(versionRef, safetyEvidence, idempotencyKey, expectedVersion)
  -> PromotionResult

DocumentReviewService.review|requestCorrection|reject|accept(command, expectedVersion)
  -> ReviewResult

DocumentGovernanceService.classify|reclassify(
  target: LogicalDocumentRef|DocumentVersionRef, command, expectedVersion
)
  -> ClassificationResult

DocumentVisibilityService.setVisibility(
  target: LogicalDocumentRef|DocumentVersionRef|DocumentContextLinkRef,
  command, expectedVersion
)
  -> VisibilityResult

DocumentVisibilityService.setClientVisibleVersion(
  documentRef, versionRef, command, expectedVersion
)
  -> VisibilityResult

DocumentContextService.link|unlink(command, expectedVersion)
  -> ContextLinkResult

DocumentVersionService.authorizeReplacement|advanceCurrent(command, expectedVersion)
  -> VersionResult

DocumentAccessService.authorizePreview|authorizeDownload(actor, versionRef, purpose)
  -> BoundedObjectAccess

DocumentDispositionService.archive|scheduleDeletion|applyHold|releaseHold(command, expectedVersion)
  -> DispositionResult

DocumentReconciliationService.reconcileUpload|reconcileStorage|findOrphans(scope, cursor)
  -> RecoveryPage
```

`share` remains a recognized authorization action but has no Release 1A execution contract.
External/partner sharing stays unavailable until the existing Product Owner decision, consent,
recipient validation, provider activation and enhanced review are complete.

### Upload intent contract

- Authorizes before creating an object path and binds one actor/context/request, object, operation,
  maximum bytes, allowed content class, expiration and single-use correlation.
- Browser-supplied filename/MIME are advisory only. The provider capability cannot list/read/delete
  and must target a unique no-overwrite object. Adapter compatibility must prove provider/gateway
  size enforcement and that retry/reuse cannot mutate a finalized or scanned object; otherwise the
  design must seal/copy exact bytes under a new immutable locator before validation and scanning.
- Finalize accepts only the exact expected object receipt/size and consumes the intent atomically.
- Duplicate finalize/retry returns the prior durable outcome; a conflicting receipt returns 409 and
  never changes lineage.

### Query and cursor contract

- Authorization, visibility and classification are applied before ordering/pagination.
- Staff queue/detail queries require an authorized staff scope, apply role/resource grants and
  classification before counts, ordering or cursor construction, and return only allowlisted
  operational metadata. They never enumerate other scopes or expose quarantine/unknown/rejected
  bytes to ordinary staff.
- Opaque cursors bind actor context, policy/auth snapshot, filter, stable sort/watermark and expiry;
  they expose `hasMore`, not a hidden exact total.
- Unauthorized/missing resources use the same normalized not-found response and timing envelope.
- Client DTOs contain only allowlisted public type/title/copy keys, semantic states, service label,
  dates, an approved version label and exact owning routes; never storage keys, provider payloads,
  signed URLs, internal links/comments or hidden counts.
- Staff DTOs are a different allowlist. They may expose structured internal/compliance fields only
  when the exact role, resource scope, classification and assurance permit them; they never expose
  other scopes, storage keys, signed URLs, raw provider/scanner payloads or content through list
  metadata. Cross-audience serialization tests fail if a staff-only field reaches a client DTO.

### Download/preview contract

- Fresh authorization and final fence precede each access handoff.
- A signed URL is one-object/read-only and expires within ADR 003. It is not persisted or emitted to
  analytics/logs and may be reused until provider expiry unless a future proxy/single-use control is
  approved; copy must not falsely claim otherwise.
- Audit distinguishes `access_authorized` from an actually observed provider delivery. It must not
  claim download completion without evidence.
- Response headers use safe `Content-Type`, `Content-Disposition`, filename encoding, nosniff and
  preview sandbox/CSP controls.

## 12. Events and background jobs

### Durable domain/outbox events

- `document_request.published|cancelled|waived|satisfied`
- `document_upload.authorized|finalized|expired|abandoned`
- `document_version.quarantined|validated|scan_completed|promoted|rejected`
- `document_review.started|accepted|correction_requested|rejected`
- `document.classified|reclassified|effective_classification_changed|visibility_changed|
  client_visible_version_changed`
- `document_version.superseded|classified|reclassified|effective_classification_changed|
  visibility_changed`
- `document_context.linked|unlinked|visibility_changed`
- `document_access.authorized|provider_delivery_observed`
- `document_disposition.archived|deletion_scheduled|held|hold_released|purged`
- `document_reconciliation.issue_opened|resolved`

Events contain opaque identifiers, stable codes, versions, trusted time and correlation only. They
do not contain bytes, filenames, extracted text, comments, signed URLs or sensitive values.
Classification events include an allowlisted target kind (`document|version`), resulting class and
policy/evidence code only—not the protected reason or content.
Every event is post-commit outbox notification, never authorization or state authority. Consumers
must re-read canonical Postgres through their authorized owner port; replay/reordering cannot grant
access. Link/unlink/replacement/reclassification records the effective-class outbox fact atomically
with the resource mutation, CAS result, epoch invalidation and audit evidence in the same Postgres
transaction. A post-commit dispatcher publishes at least once; consumers are idempotent, tolerate
duplicates/reordering and re-read authorized canonical state.

### Coordinated jobs

- validate/scan quarantine object;
- promote clean object and reconcile source/destination/checksum;
- expire unused upload intents and delete abandoned quarantine objects after approved TTL;
- retry scanner/promotion with bounded attempts and manual recovery after exhaustion;
- reconcile metadata/object inventory, missing objects and orphaned objects;
- evaluate retention/deletion eligibility and execute authorized purge;
- emit minimized notifications after durable state, not before;
- future M065/M066/M067 processing only after separate gates.

Each job has an idempotency key derived from operation/resource/version/policy, compare-and-set
state transition, maximum attempts/backoff, dead-letter/manual task, safe replay and audit. Inngest
is coordinator, never document or scan-state authority.

## 13. Error states and recovery

| Condition | Client behavior | Durable recovery |
|---|---|---|
| Upload intent expired/revoked | Generic retry with current guidance | New authorization; old object orphan check |
| Network/upload interrupted | Preserve only safe local progress; no receipt claim | Resume only if approved, otherwise new intent |
| Size/type/parser mismatch | Approved bilingual reason and replacement action | Reject/quarantine cleanup; no promotion |
| Malware detected | Safe rejection without signature/vendor detail | Isolate, incident path, new upload allowed |
| Encrypted/corrupt/unsupported | Explain permitted recovery | Reject; no OCR/preview/download |
| Scanner unavailable/timeout | `Processing delayed`; no fail-open | Quarantine, bounded retry, manual task |
| Promotion uncertain | No normal access or acceptance claim | Checksum/inventory reconciliation |
| DB unavailable during finalize | No false receipt/acceptance | Idempotent finalize/reconciliation from receipt |
| Storage unavailable | No upload/read capability issued falsely | Retry with bounded recovery and operations alert |
| Review conflict/stale version | Preserve input; reload current version | 409, compare-and-set retry, no overwrite |
| Grant/context revoked | Normalized unavailable/not-found | Reauthorize from start; no cached capability reuse |
| Preview parser unavailable | Accessible explanation | Authorized download only if policy permits |
| OCR/AI unavailable | No impact on core safety/review | Manual classification/review |
| Signature unavailable | Document remains governed, unsigned | M067 task/manual fallback; no completed claim |
| Retention/hold conflict | Deny destructive action | Compliance review; preserve bytes/evidence |
| Object/metadata mismatch | Hide object; never infer clean | Reconciliation issue and incident escalation |

Client errors never expose bucket, key, scanner/parser signature, provider, internal ID, checksum,
other-client existence, policy details or staff notes.

## 14. Security and privacy requirements

- Apply `FILE_UPLOAD_SECURITY.md`, `DATA_CLASSIFICATION.md`, ADRs 003–005, `SECURITY.md` and the
  OWASP file-upload/BOLA threat model at Build review.
- Allowlist content from magic bytes plus strict parser behavior; extension and browser MIME never
  decide alone. Reject polyglots, double extensions, active content, embedded executables, macros,
  decompression bombs, oversized images, malformed PDFs and password-protected files per policy.
- Enforce limits before and during streaming; do not buffer arbitrary uploads or decompress
  archives in Release 1A.
- Strip unsafe metadata only through an approved deterministic transformation. Preserve original
  evidence when legally/operationally required; a sanitized derivative is a new version/artifact.
- Quarantine objects are unreadable to clients, normal staff, preview, OCR, AI and unrelated
  business jobs. Only explicitly scoped validation/scanner/seal/promotion identities may read the
  exact authorized quarantine object needed for their step.
- Use least-privilege service identities per quarantine/scanner/promotion/read function; credentials
  remain server-side and out of logs/frontend.
- Run parsers, malware scanning and metadata conversion in resource-bounded, nonprivileged isolated
  workers with no default network egress or access to unrelated buckets/objects. Treat parser and
  scanner output as untrusted, bounded input.
- Never expose bucket list, storage key, original protected filename, scanner output, signed URL,
  OCR text, comments or document content through telemetry, Sentry, OpenTelemetry, PostHog,
  analytics, AI logs or support tickets.
- Personalized pages and metadata are dynamic/private/no-store; no ISR/CDN/shared browser/service-
  worker/offline cache or portal DOM/session replay/autocapture.
- Prevent CSRF on server mutations, enforce canonical origin/trusted-proxy policy, rate/concurrency
  limits, safe parser timeouts, egress allowlists and object-level idempotency.
- Preview never renders untrusted bytes in the authenticated application origin. Release 1A uses a
  dedicated credentialless preview origin inside an opaque-origin iframe sandbox; it receives no
  application cookies/storage and never combines `allow-scripts` with `allow-same-origin`. Its CSP
  is at least `default-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none';
  connect-src 'none'`. Uploaded HTML/SVG/active content is never rendered. A PDF/image viewer or
  server rasterizer must pass the Build security tests before activation; otherwise offer only an
  authorized attachment download. Download headers prevent MIME sniffing and header injection.
- Revocation blocks new reads immediately. Existing provider URLs have only their bounded expiry;
  the product never represents them as instant-revocable unless proven.
- Staff access to Confidential/Highly Sensitive bytes and all share/visibility/hold/delete actions
  are auditable with no content.
- Retention, legal hold, backup restore and incident response preserve safety state. A restored
  quarantined/unknown object cannot become accepted merely because metadata was restored.
- No full payment-card data is stored. No client document trains a model. External processors need
  approved purpose, data-processing terms, region/retention controls and separate activation.

## 15. UX and accessibility requirements

- The top-level view prioritizes: requested/overdue, correction required, processing/review,
  accepted/final deliverables, then history.
- Every card/row answers document type, related service/context, semantic state, requested/due or
  received time, next action and safe explanation.
- Upload begins from a named request whenever possible; generic upload is absent or limited by an
  approved policy so clients cannot guess destination/sensitivity.
- Drag-and-drop is an enhancement only. A keyboard-accessible native file input and mobile file/
  camera picker are always available.
- Instructions announce allowlisted formats/size and quality expectations before selection.
- Selected files can be reviewed and removed before upload; filenames are escaped and never used as
  HTML.
- Progress has visible text and an ARIA live status. Processing after transfer is clearly separate
  from byte-transfer progress and business review.
- Cancellation/retry never claims server deletion without confirmed outcome.
- Error messages identify the safe action, retain permissible form context and move focus to the
  summary without revealing security internals.
- Preview has keyboard controls, semantic page/zoom labels and an accessible download/textual
  fallback when allowed. No essential action relies on preview.
- The Admin review queue is scoped by role and assigned/authorized cases before counts or rows. It
  separates safety-processing/recovery from operational review, correction and final-deliverable
  work; ordinary staff cannot open quarantine or malicious bytes.
- The staff review workspace keeps client-visible, internal and compliance-only comments in
  visibly distinct labeled regions with no copy/fallback between them. Review, classification,
  visibility, hold and destructive controls declare required assurance and confirmation.
- Status uses icon, text and semantic heading—not color alone. Motion is subtle and respects
  `prefers-reduced-motion`.
- 320px reflow, 200% zoom, logical focus order, 44×44px targets, screen-reader labels and WCAG 2.2 AA
  contrast are required.
- Original filenames are not translated. Client-visible type/status/instruction/correction copy is
  localized and semantically reviewed.

## 16. Bilingual requirements

- Spanish and English parity is required for navigation, document/request labels, instructions,
  allowed-format guidance, status, due/received dates, warnings, rejection/correction reasons,
  upload progress, recovery, consent, notifications and accessibility names.
- Stable codes are locale-neutral; localization never changes transition, authorization,
  classification, retention or upload policy.
- Critical instructions never silently fall back to a mixed locale. Missing approved copy disables
  the affected action and offers support.
- User-entered comments and original filenames remain in their original language. Automatic
  translation requires a future approved capability and must preserve the source.
- Date/time/byte/page formats localize consistently. Due-date timezone/source is explicit; no
  invented deadline is shown.
- Security wording describes outcomes safely and consistently without exposing scanner internals or
  implying that a clean scan proves authenticity.

## 17. Acceptance criteria

### Architecture and authorization

- [ ] M011 reuses one `Document`/`DocumentVersion` domain and approved Supabase private Storage; no
  parallel MinIO/bucket/document database exists.
- [ ] Identity/membership alone cannot list, upload, preview or download; every operation proves
  case/document grant, visibility, context, classification/assurance and resource epoch.
- [ ] RLS/Storage/domain tests deny cross-client, cross-case, revoked, reparented, internal,
  inheritance-blocked, deleted and insufficient-assurance access.
- [ ] Direct detail, cursor, upload-finalize, preview and download paths reauthorize and final-fence
  rather than trusting a prior list or signed reference.
- [ ] No user path uses `service_role`, owner or `BYPASSRLS`.

### Upload safety

- [ ] Every client/provider/channel upload lands in quarantine and is unreadable/unpreviewable/
  unprocessable by normal consumers before clean validation and proven promotion.
- [ ] Declared/actual bytes, magic type, strict parser, encryption, page/image limits, checksum and
  malware verdict are validated under a versioned policy.
- [ ] Spoofed MIME, double extension, polyglot, HTML/SVG/script, executable, archive/macro,
  malformed/encrypted file, bomb/oversize and unknown type tests fail closed.
- [ ] Scanner failure/timeout remains quarantined, retries are bounded and no human/manual toggle
  can mark an unsafe object clean or promote it; progress requires an approved exact-hash rescan
  with valid evidence, replacement or deletion.
- [ ] Every transformed/generated/provider-returned byte artifact receives independent immutable
  provenance, checksum, content/parser validation, scan and promotion; divergent/polyglot/mutated
  outputs fail closed even when provider metadata or signature evidence appears valid.
- [ ] Finalize/promotion retry and provider uncertainty are idempotent and reconcile checksum,
  metadata, object tier and expected version before access.
- [ ] Promotion state and quarantine-object disposition reconcile independently; successful source
  cleanup cannot erase `promoted`, and a retained/deletion-failed quarantine copy grants no access.
- [ ] Upload capability tests prove unique no-overwrite targets, provider/gateway byte limits and
  that capability replay cannot alter finalized/scanned bytes; unsupported provider behavior fails
  the compatibility gate.
- [ ] Cross-client duplicate information is never exposed.
- [ ] Release 1A rejects document links/reuse across canonical client/data-owner boundaries until
  DOC-010 approval and dedicated authorization tests.

### Versions and review

- [ ] Replacement creates a new immutable version and compare-and-set current pointer; concurrent
  replacements cannot silently overwrite or fork an undisclosed current version.
- [ ] Safety clean, operational accepted, client visible, final/signed and request satisfied remain
  separate facts and require their exact authorities.
- [ ] Upload does not auto-complete a request/task that requires review.
- [ ] Client-visible, internal and compliance-only comments are physically/contractually separate;
  client/staff DTOs use distinct allowlists and negative cross-audience serialization tests prove
  no fallback leak.
- [ ] A final/signed version cannot be edited; successor/correction preserves provenance.
- [ ] Document- and version-target classification tests prove inheritance of the maximum applicable
  class and deny unauthorized/stale/unsupported downgrade, link-based downgrade and replacement-
  based downgrade while preserving prior evidence.
- [ ] Link to a more sensitive purpose, concurrent unlink/relink, document-versus-version
  reclassification, visibility plus client-visible-pointer mutation, stale CAS, idempotent retry and
  outbox replay tests prove no lower-class/visibility window and no event grants access.
- [ ] Outbox tests cover crash after commit/before dispatch, eventual retry, duplicate and reordered
  delivery, proving the durable fact is not lost and no delivery grants access without a canonical
  authorized reread.

### Access, retention and recovery

- [ ] Signed object access is one-object/read-only/short-lived and never stored/logged/analytically
  captured; tests acknowledge provider reuse until expiry unless a stronger control is implemented.
- [ ] Preview/download headers, filename encoding, CSP/sandbox and XSS/path/header injection tests
  pass, including active PDF/image payloads, cookie/storage/parent/opener reads, navigation, popup,
  form and external-fetch attempts; the preview origin has no application credentials.
- [ ] Staff sensitive access and classification/context-link/visibility/share/hold/delete changes
  create minimized audit evidence; authorization issuance is not mislabeled as completed download.
- [ ] Link/unlink tests require authorization over both sides, enforce the canonical data-owner
  boundary/direct deny/classification/assurance, use CAS, invalidate epochs and do not enumerate an
  unauthorized document or target context.
- [ ] Legal hold/retention blocks prohibited deletion but does not grant read; authorized disposition
  reconciles Postgres, object inventory, tombstone and backup lifecycle.
- [ ] Restore tests preserve quarantine/safety/version state and never expose an unknown object.
- [ ] Storage, scanner, DB, processing and notification failures have bounded retry and manual path
  without false receipt/acceptance.

### Experience

- [ ] Client views prioritize pending/correction actions and show clear received/processing/review/
  accepted distinctions in approved Spanish and English.
- [ ] Authorized staff queues show only assigned/permitted cases, keep safety recovery separate from
  business review and never permit ordinary preview of quarantine/malicious bytes.
- [ ] Staff review UI makes client-visible/internal/compliance comment boundaries explicit and
  requires the correct permission/assurance for visibility, hold, share and deletion actions.
- [ ] File input works without drag/drop, with keyboard/screen reader at 320px, 200% zoom and reduced
  motion; progress/errors are announced.
- [ ] Mobile camera/file-picker guidance does not imply unsupported HEIC acceptance and offers a safe
  recovery path.
- [ ] Original filenames, document names/content and protected metadata never enter external
  analytics, telemetry or shared/offline cache.

## 18. Negative acceptance criteria

- [ ] No product route, table, RLS/Storage policy, bucket, scanner/OCR/signature adapter or real file
  is created by this documentary phase.
- [ ] No public bucket, permanent URL, broad bucket list, exposed storage key or filename-derived key.
- [ ] No access based only on email, client record, company relation, payment, route, checksum,
  object key, cursor or knowledge of a public reference.
- [ ] No client/internal cross-visibility, hidden context/count leak or cross-client dedupe signal.
- [ ] No quarantine/unknown/failed-scan object reaches preview, OCR, AI, signature, delivery or
  accepted storage.
- [ ] No extension/browser MIME-only acceptance, active-content rendering, archive extraction or
  password-protected-file processing.
- [ ] No clean scan is labeled authentic/approved; no upload is labeled request/task completion.
- [ ] No replacement mutates prior bytes or loses hash, lineage, source, review or audit evidence.
- [ ] No OCR/classifier/LLM output changes case truth or validates identity/tax/legal/signature data
  without the owning approved human workflow.
- [ ] No sensitive document/content/filename/comment/signed URL appears in logs, errors, traces,
  analytics, DOM capture, tickets, AI history or test fixtures.
- [ ] No delete bypasses retention/legal hold, and no hold grants access.
- [ ] No restored, orphaned or metadata-mismatched object becomes client-visible by default.
- [ ] No MinIO/self-hosted storage is introduced without a later accepted ADR and migration plan.
- [ ] No provider or external activation is reported complete without controlled evidence.

## 19. Dependencies

- M007 Identity and Account; ADRs 004/011 for session, context, grants and assurance.
- M008–M010 client dashboard/service/process projections and proposed ADRs 012–014.
- M018/M021/M022 Client, ServiceOrder and CaseFile canonical ownership.
- M019 owns Organization/Business; M011 stores only an authorized typed context reference and does
  not duplicate or mutate business identity data.
- M023 Tasks, M025 Communications, M026 Notifications and M077 Audit.
- M014 Billing and Payments owns invoices, payment state and financial reconciliation; M011 may
  retain only typed document-context references and does not infer payment authority or status.
- M065 Processing, M066 Generation and M067 Signature as separate future owners.
- M078 Consent, M080 IAM, M081 RBAC, M082 PII, M083 Secrets, M084 Integration Security and M085
  Retention/Deletion.
- `FILE_UPLOAD_SECURITY.md`, `DATA_CLASSIFICATION.md`, `BACKUP_AND_RECOVERY.md`, ADRs 003–005 and
  `SECURITY.md`.
- Approved Supabase private Storage project/configuration and restricted Postgres/RLS domain.
- Provider-neutral `StorageProvider`, future `MalwareScannerProvider`, OCR/extraction and signature
  adapters after explicit activation.
- Inngest coordination/outbox, observability redaction, i18n, design system and human operations
  recovery.

M011 architecture does not require live Storage, scanner, OCR, DocuSeal, partner or channel
credentials. Real uploads/processors/providers remain separately gated.

## 20. Risks

| Risk | Impact | Architectural control |
|---|---|---|
| BOLA/IDOR or context leak | Client sees another file | Explicit grants, RLS, opaque refs, final epoch fence |
| Malicious/polyglot input | Code execution/data compromise | Quarantine, content/parser allowlist, scan, sandbox, no active types |
| Clean scan mistaken for approval | Wrong operational/legal decision | Separate safety and review axes/copy/tests |
| Upload mistaken for receipt/task completion | Client misses required correction | Durable finalize + explicit review/satisfaction |
| Signed URL leakage | Temporary unauthorized byte access | Fresh auth, one object, short expiry, no logging/cache, bounded claims |
| Storage policy drift | Direct object access | Policy-as-code tests, no list access, service-minted capabilities |
| Version race/overwrite | Evidence loss or wrong current file | Immutable versions, expected-version CAS and reconciliation |
| Cross-client dedupe leak | Reveals another client's data | Scoped duplicate detection and no cross-context signal |
| Internal comment/filename leak | Privacy/compliance harm | Separate fields/DTOs, negative tests, minimized telemetry |
| Scanner/parser outage | Unsafe fail-open or stalled work | Quarantine, bounded retry, manual task, no clean override |
| Orphan/object mismatch | Data loss or unauthorized exposure | Inventory/checksum reconciliation and fail-closed state |
| Retention/hold error | Illegal deletion or over-retention | Versioned policy, approval, audit, restore/deletion tests |
| Restore changes safety state | Quarantined object exposed | Independent inventory/safety reconciliation before cutover |
| AI/OCR overreach | False data or external disclosure | Separate modules, narrow tools, redaction, human confirmation |
| Mobile format mismatch | Client cannot upload iPhone file | Explicit allowlist guidance and approved HEIC conversion decision |
| Scope expansion into DMS | Excess complexity | Narrow R1A, metadata search only, module boundaries |

## 21. Open questions

- [NEEDS PRODUCT OWNER DECISION: approve the Release 1A PDF/JPEG/PNG allowlist, 25 MiB per-file
  limit, page/image/account/request quotas and whether HEIC or Office formats are required.]
- [NEEDS PRODUCT OWNER DECISION: approve document-request/checklist states, required/optional/waived
  rules, due-date authority and whether any reminder or service-response expectation exists.]
- [NEEDS PRODUCT OWNER DECISION: approve client-facing document/upload/review status vocabulary,
  correction/rejection reason allowlist and semantically equivalent Spanish/English copy.]
- [NEEDS PRODUCT OWNER DECISION: approve the document type/category/classification matrix and which
  titles, original filenames, version labels and source-channel fields may be client-visible.]
- [NEEDS PRODUCT OWNER DECISION: approve which Highly Sensitive categories require a direct
  document grant and step-up instead of ordinary case inheritance, including staff assurance.]
- [NEEDS PRODUCT OWNER DECISION: approve upload-intent lifetime, single/multiple-file and resumable
  behavior, daily/concurrent quotas, cancellation semantics and scoped duplicate UX.]
- [NEEDS PRODUCT OWNER DECISION: select/approve the malware-scanner provider, versions/data region,
  retry/manual-recovery policy with no human clean override, and quarantine/orphan TTL after
  security review.]
- [NEEDS PRODUCT OWNER DECISION: approve preview/download field and action policy, signed-URL
  lifetime within ADR 003, watermark, Content-Disposition, reauthentication and bulk-export rules.]
- [NEEDS PRODUCT OWNER DECISION: approve staff review roles, segregation/two-person controls and
  authority for accept, correction, rejection, classification and client visibility.]
- [NEEDS PRODUCT OWNER DECISION: approve current-version/superseded visibility, correction history
  and explicit reuse/linking rules across services, cases, businesses or household contexts.]
- [NEEDS PRODUCT OWNER DECISION: approve client-visible comment policy, internal/compliance comment
  authority and notification copy/fallback for correction or acceptance.]
- [NEEDS PRODUCT OWNER DECISION: approve type/service-specific retention, quarantine/orphan cleanup,
  client draft deletion, legal-hold application/release authority and backup purge expectations
  after Illinois/legal review.]
- [NEEDS PRODUCT OWNER DECISION: decide whether prospect/third-party temporary upload links enter
  Release 1B, with identity/consent/purpose/expiry/count and revocation policy.]
- [NEEDS PRODUCT OWNER DECISION: approve which email, WhatsApp, chat or partner attachments may enter
  M011, their classification/consent/source evidence and secure-channel fallback; default reject.]
- [NEEDS PRODUCT OWNER DECISION: approve M065 OCR/extraction/quality scope, processors/data regions,
  redaction, retained artifacts, confidence thresholds and human-validation rules.]
- [NEEDS PRODUCT OWNER DECISION: approve M066 generated-document types, template/version ownership,
  input snapshot, reviewer/approval evidence and draft/final visibility policy.]
- [NEEDS PRODUCT OWNER DECISION: approve M067 signature provider, eligible document types, signer/
  order/authentication, reminders, evidence/certificate and retention/revocation policy.]
- [NEEDS PRODUCT OWNER DECISION: approve external partner-sharing purpose, recipient validation,
  document allowlist, consent, expiry, revocation, contract and delivery evidence.]
- [NEEDS PRODUCT OWNER DECISION: approve M011 analytics/operational metrics, viewers, retention and
  zero-content/zero-filename payload allowlist.]
- [NEEDS PRODUCT OWNER DECISION: approve M011 notification events, channels/preferences, timing and
  copy; default is portal-only state with no response-time promise.]
