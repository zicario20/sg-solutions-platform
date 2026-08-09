# File Upload Security Architecture

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Phase 0 design; no scanner vendor selected or implemented
- Update rule: update before expanding file types, size limits, scanners or retention behavior

M012 messaging attachments are only purpose-bound entry points into this same M011 lifecycle.
M012 stores an opaque document/version reference and client-safe projected state; it never stores
authoritative bytes, trusts browser MIME/filename, exposes quarantine objects or receives signed
URLs. A message may remain accepted while its attachment is processing or rejected, and attachment
availability requires a fresh M011 authorization check.

## Allow and deny policy

Release 1A uses an allowlist: PDF, JPEG and PNG identified by validated content, not filename or
client-supplied MIME. Executables, scripts, HTML/SVG, macro-enabled documents, disk images,
password-protected/encrypted files and archives are rejected. Unknown or ambiguous formats fail
closed. Office documents, HEIC and archive ingestion require a later threat review and explicit
allowlist change.

Maximum accepted upload is **25 MiB per file** before any decompression or processing. The server
also enforces request and account/case quotas. Filenames are display metadata only; storage keys use
opaque generated identifiers and normalized extensions derived after validation.

The canonical unresolved allowlist/limit policy is M011 decision `DOC-001`; no format expansion or
real upload is authorized before that decision and its threat tests.

## Lifecycle

```text
request upload
→ authorize actor and target case
→ issue bounded quarantine upload
→ finalize durable receipt and reserve immutable quarantined version/audit evidence
→ validate declared size, actual size and content-based type
→ calculate cryptographic checksum
→ scan for malware
→ record safety verdict (`clean` or stable fail-closed reason)
→ promote/copy to private accepted storage
→ reconcile object/checksum and compare-and-set approved pointers/audit evidence
```

An upload request binds actor, session/context, case/resource/request, exact opaque object, maximum
bytes, allowed content class, expiration, policy version and a single-use correlation identifier.
Direct uploads land only in quarantine. Browser filename/MIME are advisory. Finalization verifies
the exact provider receipt/object and consumes the intent atomically. Objects cannot be downloaded
by clients or normal staff until safety-clean promotion is proven; promotion does not mean staff
acceptance, request/task satisfaction or client visibility.

Every upload capability targets a unique no-overwrite object and cannot list/read/delete. The
provider/gateway must prove streaming byte limits and that replay cannot mutate finalized or
scanned bytes. If it cannot, finalization seals/copies the exact received bytes to a new immutable
quarantine locator before validation/scanning; unsupported behavior fails the provider gate.

## Validation and scanning

- Validate magic bytes and parser behavior; do not trust extension or `Content-Type`.
- Calculate SHA-256 after upload and before promotion. The checksum supports integrity and
  duplicate detection; it is not an authorization token.
- Duplicate detection is scoped to an authorized client/case context. Cross-client deduplication
  must not reveal that another client uploaded the same bytes.
- Scanner verdicts are `pending`, `clean`, `malicious`, `unsupported`, `scan_failed` or `timed_out`.
- Only `clean` can promote automatically. Failures and timeouts remain quarantined and create a
  manual recovery task; they never fail open.
- Archive files and executables are rejected before scanning. Nested decompression is not part of
  Release 1A.
- Malware detections isolate the object, deny all normal downloads, preserve bounded forensic
  metadata and trigger the incident path. Content is never copied into logs.
- Parsers, scanners and metadata converters run as resource-bounded, nonprivileged isolated workers
  with no default network egress or access to unrelated buckets/objects. Their output is untrusted,
  bounded input.
- Every artifact with new bytes—including conversion/OCR/redaction output, generated documents and
  signed-provider returns—receives a new immutable version/locator, provenance, checksum,
  content-based MIME/parser validation, scan under a versioned policy and its own promotion before
  preview/delivery/downstream use. Provider metadata/evidence and predecessor scans are insufficient.

No scanner vendor is selected by this document. A provider decision, data-processing review and
failure-mode test are required before implementation.

## Storage and versions

Quarantine and accepted objects use separate private buckets or equivalently isolated prefixes and
policies. Keys contain no email, client name, SSN, case title or original filename. Metadata records
checksum, validated type, bytes, scanner/version, verdict, classification, case/resource binding,
uploader, timestamps and version lineage.

Replacing a document creates a new immutable version; it does not overwrite history. Safety,
promotion, operational review, visibility, current-version pointers and retention/legal hold are
separate facts. A current pointer may change by compare-and-set only after the applicable criteria.
Failed uploads and abandoned quarantine objects are removed by an idempotent orphan-cleanup job
after the approved window. Canonical unresolved policies are `DOC-006`, `DOC-007`, `DOC-010` and
`DOC-012` in the M011 PRD/activation register.

Compatibility and regression tests cover capability replay/no-overwrite, post-finalize mutation,
provider size-limit bypass, parser/scanner egress and privilege isolation, MIME/polyglot output from
converters, active signed PDFs, changed bytes across retries and apparently valid provider metadata
paired with unsafe content.

## Downloads and signed URLs

Every download reauthorizes the actor against current role, case grant, resource visibility and
document sensitivity. Client access may inherit from an active case only for client-visible
documents; Highly Sensitive documents can require an additional explicit grant. Staff downloads of
Confidential or Highly Sensitive objects emit audit events.

Signed URLs are single-object, read-only and short-lived: five minutes by default and never more
than fifteen minutes in Release 1, subject to `DOC-008`. Revocation blocks all new authorization
immediately; a previously issued provider URL may remain reusable until its bounded expiry unless
the selected provider/control proves earlier invalidation. The product and audit must not claim
single use or completed download from authorization issuance alone.

## Rejection and recovery

Stable rejection reasons include `size_exceeded`, `type_not_allowed`, `content_type_mismatch`,
`malware_detected`, `encrypted_or_password_protected`, `scan_failed`, `upload_expired`,
`authorization_revoked` and `integrity_mismatch`. Client copy explains the next safe action without
revealing scanner internals. Staff recovery can retry a scanner, request a new upload or securely
delete quarantine data. No human toggle may convert `scan_failed`, `timed_out`, unknown or other
non-clean evidence to `clean` or promote it. Recovery may only rescan the exact hash with an
approved scanner/policy, use a separately controlled scanner that produces valid evidence, replace
the bytes or delete them. Future risk acceptance cannot falsify the verdict and requires its own
ADR, Product Owner gate and enhanced security review.

## Deletion and incidents

Deletion tombstones metadata, revokes access, schedules object removal and records an audit event.
Legal hold blocks deletion. Orphan cleanup reconciles missing metadata/objects without crossing
client boundaries. An upload incident triggers containment, access revocation, evidence
preservation, provider notification path, Product Owner escalation and a documented post-incident
review.
