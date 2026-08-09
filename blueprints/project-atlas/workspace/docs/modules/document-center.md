# Module PRD — Document Center

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Umbrella architecture; dedicated M011 PRD is canonical; no Build gate
- Catalog modules: M011, M065, M066, M067 (Release 1A candidate scope is limited to the secure
  core/upload architecture; no behavior is implemented)

## Canonical module split

- `m011-document-portal.md` is the canonical PRD for requests, upload intents, quarantine/safety/
  promotion, logical documents, immutable versions, operational review, visibility, authorized
  preview/download and disposition hooks.
- M065 owns OCR, extraction, classification/quality suggestions and redaction processing.
- M066 owns generated-document templates, drafts and approval evidence.
- M067 owns electronic-signature workflow and signed artifacts.
- Proposed ADR 015 governs M011 document authority, state separation, Storage boundary, final fences
  and recovery.
- If this umbrella conflicts with the dedicated M011 PRD inside M011 scope, the dedicated PRD
  governs after Product Owner approval; unresolved policy is escalated rather than inferred.

## 1. Purpose

Receive, classify, version, request and deliver private client documents without exposing untrusted
files or crossing client/case authorization boundaries.

## 2. Business value

Replace insecure ad-hoc exchange with a traceable document workspace that tells clients what is
missing and gives staff reliable evidence.

## 3. Scope

Upload requests, quarantine, content validation, malware scan abstraction, checksum/duplicate
detection, accepted private storage, metadata, versions, document requests, client-visible/internal
classification, preview/download authorization, signed URLs, receipt confirmation, audit, retention
hooks, deletion/tombstone, orphan cleanup and manual recovery.

## 4. Explicit out of scope

Public file hosting, email attachments as authoritative storage, automatic OCR/extraction/generation,
RAG ingestion, arbitrary archive processing, a scanner vendor selection and DocuSeal signing
workflow beyond linking signed artifacts.

## 5. Actors

Authorized client, Owner/admin, authorized specialist/support, Compliance Reviewer, read-only staff
where permitted, quarantine/scanner worker, storage adapter and cleanup/reconciliation job.

## 6. User journeys

1. Staff requests a named document for a case with instructions and due date.
2. An authorized client requests an upload slot bound to that case/request.
3. The file enters quarantine, is validated/checksummed/scanned and becomes safety-clean/promoted or
   remains safety-rejected/quarantined under the canonical M011 axes.
4. Staff reviews a safety-clean promoted version and separately records operational acceptance,
   correction or rejection; promotion never implies business acceptance.
5. Authorized users preview/download through short-lived signed access.
6. A replacement creates a new version while preserving history.
7. Retention/deletion removes eligible bytes and preserves the required audit tombstone.

## 7. States and transitions

- Request: `draft → requested → upload_pending → received → under_review → satisfied|
  needs_correction|waived|expired|cancelled`.
- Safety: `pending → validating → scanning → clean|malicious|unsupported|encrypted|corrupt|
  scan_failed|timed_out`.
- Promotion: `quarantine_only → promoting → promoted|promotion_uncertain|promotion_failed`.
- Operational review: `received → under_review → accepted|needs_correction|rejected`.
- Visibility, immutable version lineage, lifecycle and legal hold remain separate axes under M011.
- Only safety-clean, checksum/inventory-reconciled bytes may promote; promotion is not operational
  acceptance, request/task satisfaction or client visibility.
- A `scan_failed`/timeout remains quarantined until retry or authorized deletion; it never fails open.

## 8. Business rules

- Release 1A candidate default is content-validated PDF/JPEG/PNG up to 25 MiB, subject to DOC-001;
  no format/limit is approved for Build until that Product Owner decision.
- Storage keys are opaque and never contain client identifiers or original filenames.
- SHA-256 supports integrity and scoped duplicate detection; cross-client matches are never exposed.
- Replacements create immutable versions; no in-place overwrite.
- Client-visible is an explicit resource property; internal is default.
- Receipt means SG Solutions received the file, not that it is complete, accurate or approved.

## 9. Authorization rules

Upload authorization binds actor, active case grant, request/resource, size/type limits and expiry.
Downloads reauthorize every time. Active case access may inherit to client-visible documents under
ADR 004; internal documents never inherit and Highly Sensitive documents may require a separate
grant. Staff downloads of Confidential/Highly Sensitive files are audited. Signed URLs are not
authority and expire within the architecture limit.

## 10. Data requirements

Document/request/version IDs; case/client references; title/category; classification; visibility;
inheritance block; original display name; normalized type; bytes; opaque storage keys; SHA-256;
scanner/version/verdict; uploader; request/due/receipt/status; version lineage; retention/legal hold;
deletion/tombstone; audit/correlation. Document bytes never enter Postgres, logs or analytics.

## 11. API or service contracts

The exact M011 contracts are owned only by `m011-document-portal.md`: separate Client/Staff query
services plus DocumentRequest, UploadIntent, UploadProcessing, Promotion, Review, Governance,
Visibility, Context, Version, Access, Disposition and Reconciliation services. This umbrella defines
no competing `UploadService`, `DocumentService`, `DownloadService` or retention-policy owner. M085
owns retention policy; M011 owns document disposition commands/state and references that policy.

## 12. Events and background jobs

Canonical M011 namespaces distinguish `document_request.published|satisfied`,
`document_upload.finalized`, `document_version.quarantined|scan_completed|promoted|rejected`,
`document_review.accepted|correction_requested|rejected`,
`document.visibility_changed|client_visible_version_changed`,
`document_version.visibility_changed`, `document_context.visibility_changed`,
`document_access.authorized|provider_delivery_observed`
and `document_disposition.deletion_scheduled|purged`. Scan, orphan, disposition and reconciliation
jobs are idempotent, retry-bounded and manually recoverable; M085 remains retention-policy owner.

## 13. Error states and recovery

Expired grant, revoked case access, size/type mismatch, integrity mismatch, malicious content,
encrypted/password-protected input, scanner unavailable/timeout, promotion failure, missing object,
metadata/object mismatch and retention blocked by legal hold. Recovery uses a new upload, scanner
retry over the exact hash under an approved scanner/policy, replacement or deletion; no human
toggle or staff review may convert non-clean safety evidence to `clean` or authorize promotion.

## 14. Security and privacy requirements

Implement all controls in `FILE_UPLOAD_SECURITY.md`, ADR 003/004/005 and data classification.
Buckets are private; MIME validation is content-based; executable/archive policy fails closed;
telemetry contains only opaque metadata; staff downloads are audited; URLs are read-only and
short-lived; backups/recovery preserve scan status; security review includes malicious/cross-client
tests.

## 15. UX and accessibility requirements

Upload UI explains allowed types/size before selection, exposes progress and resumable next action,
announces errors, supports keyboard/file picker, never relies on color, provides accessible preview
fallback/download and distinguishes received, scanning, safety rejection/promotion, staff
acceptance/correction/rejection and client visibility. Mobile camera files
must still satisfy the allowlist.

## 16. Bilingual requirements

Requests, allowed-format guidance, rejection reasons, receipt status, due dates and recovery actions
require approved English/Spanish parity. Original filenames are not translated.

## 17. Acceptance criteria

- Every upload lands in quarantine and cannot be downloaded before a clean verdict/promotion.
- Extension/MIME spoofing and executable/archive inputs are rejected.
- Cross-client users cannot request upload/download URLs for another case.
- Version replacement preserves prior metadata and audit lineage.
- Scanner timeout remains quarantined and creates a recoverable task.
- Authorized deletion removes eligible objects and records an auditable tombstone.

## 18. Negative acceptance criteria

- No public bucket/object URL, permanent signed URL or email-based grant.
- No raw file/document content in logs, traces, analytics or error reports.
- No failed/unknown scan promoted automatically.
- No original filename used as storage key.
- No cross-client deduplication signal.

## 19. Dependencies

Identity/Access, ADR 003/004/005, file-upload security, data classification, audit/activity history,
case management, Storage provider, retention policy and backup/recovery.

## 20. Risks

Malware, parser exploits, storage-policy drift, signed-URL leakage, orphaned objects, scanner outage,
oversized uploads, cross-client dedupe leakage and deletion inconsistent with legal hold. Defense is
quarantine, fail-closed state, reconciliation, policy tests and audit.

## 21. Open questions

The dedicated M011 PRD consolidates all unresolved choices as `DOC-001`–`DOC-020` and synchronizes
them with `EXTERNAL_ACTIVATION_REGISTER.md`. This umbrella creates no additional policy decision.
