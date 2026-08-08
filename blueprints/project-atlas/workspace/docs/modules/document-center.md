# Module PRD — Document Center

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Implementation-ready architecture draft; open Product Owner decisions remain; no Build gate
- Catalog modules: M011, M065, M066, M067 (Release 1A implements only secure core/upload behavior)

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
3. The file enters quarantine, is validated/checksummed/scanned and becomes accepted or rejected.
4. Staff reviews an accepted version and records receipt/status.
5. Authorized users preview/download through short-lived signed access.
6. A replacement creates a new version while preserving history.
7. Retention/deletion removes eligible bytes and preserves the required audit tombstone.

## 7. States and transitions

- Request: `requested → upload_pending → received → accepted|rejected → satisfied|cancelled`.
- Document version: `upload_authorized → quarantined → validating → scanning → accepted|rejected|
  scan_failed → deleted`.
- Only `accepted` may be promoted to normal private storage or viewed.
- A `scan_failed`/timeout remains quarantined until retry or authorized deletion; it never fails open.

## 8. Business rules

- Release 1A accepts content-validated PDF/JPEG/PNG up to 25 MiB; expansions require review.
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

- `DocumentRequestService.create|cancel|markSatisfied`.
- `UploadService.authorize(actor, caseId, requestId?, declaredMetadata) → QuarantineGrant`.
- `UploadProcessingService.validateAndScan(uploadId, idempotencyKey) → Verdict`.
- `DocumentService.promote`, `reject`, `createVersion`, `setVisibility`, `acknowledgeReceipt`.
- `DownloadService.authorize(actor, versionId) → short-lived signed URL`.
- `RetentionService.evaluate|deleteEligible`; `ReconciliationService.findOrphans`.

## 12. Events and background jobs

`document.requested`, `upload.quarantined`, `upload.scan_completed`, `document.accepted`,
`document.rejected`, `document.receipt_confirmed`, `document.version_created`,
`document.downloaded`, `document.deletion_scheduled` and `document.deleted`. Scan, orphan,
retention and reconciliation jobs are idempotent, retry-bounded and manually recoverable.

## 13. Error states and recovery

Expired grant, revoked case access, size/type mismatch, integrity mismatch, malicious content,
encrypted/password-protected input, scanner unavailable/timeout, promotion failure, missing object,
metadata/object mismatch and retention blocked by legal hold. Recovery uses a new upload, scanner
retry, staff review or deletion; no manual “clean” override without separately audited exception.

## 14. Security and privacy requirements

Implement all controls in `FILE_UPLOAD_SECURITY.md`, ADR 003/004/005 and data classification.
Buckets are private; MIME validation is content-based; executable/archive policy fails closed;
telemetry contains only opaque metadata; staff downloads are audited; URLs are read-only and
short-lived; backups/recovery preserve scan status; security review includes malicious/cross-client
tests.

## 15. UX and accessibility requirements

Upload UI explains allowed types/size before selection, exposes progress and resumable next action,
announces errors, supports keyboard/file picker, never relies on color, provides accessible preview
fallback/download and distinguishes received, scanning, accepted and rejected. Mobile camera files
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

- [NEEDS PRODUCT OWNER DECISION: confirm 25 MiB and the Release 1A PDF/JPEG/PNG allowlist.]
- [NEEDS PRODUCT OWNER DECISION: approve retention, quarantine cleanup and legal-hold authority.]
- [NEEDS PRODUCT OWNER DECISION: decide whether Highly Sensitive documents always require an
  explicit extra grant or only designated categories.]
- [NEEDS PRODUCT OWNER DECISION: approve the future scanner/provider after security and data-
  processing review.]
