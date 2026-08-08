# File Upload Security Architecture

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Phase 0 design; no scanner vendor selected or implemented
- Update rule: update before expanding file types, size limits, scanners or retention behavior

## Allow and deny policy

Release 1A uses an allowlist: PDF, JPEG and PNG identified by validated content, not filename or
client-supplied MIME. Executables, scripts, HTML/SVG, macro-enabled documents, disk images,
password-protected/encrypted files and archives are rejected. Unknown or ambiguous formats fail
closed. Office documents, HEIC and archive ingestion require a later threat review and explicit
allowlist change.

Maximum accepted upload is **25 MiB per file** before any decompression or processing. The server
also enforces request and account/case quotas. Filenames are display metadata only; storage keys use
opaque generated identifiers and normalized extensions derived after validation.

[NEEDS PRODUCT OWNER DECISION: confirm the 25 MiB Release 1A limit and whether business operations
require Office, HEIC or another format before the Document Center Build gate.]

## Lifecycle

```text
request upload
→ authorize actor and target case
→ issue bounded quarantine upload
→ validate declared size, actual size and content-based type
→ calculate cryptographic checksum
→ scan for malware
→ accept or reject with stable reason
→ promote/copy to private accepted storage
→ commit metadata and emit audit event
```

An upload request binds actor, case/resource, maximum bytes, allowed content class, expiration and a
single-use correlation identifier. Direct uploads land only in quarantine. Objects cannot be
downloaded by clients or normal staff until accepted.

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

No scanner vendor is selected by this document. A provider decision, data-processing review and
failure-mode test are required before implementation.

## Storage and versions

Quarantine and accepted objects use separate private buckets or equivalently isolated prefixes and
policies. Keys contain no email, client name, SSN, case title or original filename. Metadata records
checksum, validated type, bytes, scanner/version, verdict, classification, case/resource binding,
uploader, timestamps and version lineage.

Replacing a document creates a new immutable version; it does not overwrite history. A current
pointer may change transactionally after the new version is accepted. Failed uploads and abandoned
quarantine objects are removed by an idempotent orphan-cleanup job after the approved quarantine
window.

[NEEDS PRODUCT OWNER DECISION: approve quarantine/orphan retention and client document retention
periods after legal review.]

## Downloads and signed URLs

Every download reauthorizes the actor against current role, case grant, resource visibility and
document sensitivity. Client access may inherit from an active case only for client-visible
documents; Highly Sensitive documents can require an additional explicit grant. Staff downloads of
Confidential or Highly Sensitive objects emit audit events.

Signed URLs are single-object, read-only and short-lived: five minutes by default and never more
than fifteen minutes in Release 1. Revocation changes authorization immediately; previously issued
URLs expire at their bounded lifetime and may be invalidated earlier if the provider supports it.

## Rejection and recovery

Stable rejection reasons include `size_exceeded`, `type_not_allowed`, `content_type_mismatch`,
`malware_detected`, `encrypted_or_password_protected`, `scan_failed`, `upload_expired`,
`authorization_revoked` and `integrity_mismatch`. Client copy explains the next safe action without
revealing scanner internals. Staff recovery can retry a scanner, request a new upload or securely
delete quarantine data; it cannot mark a failed scan clean without a separately audited exception.

## Deletion and incidents

Deletion tombstones metadata, revokes access, schedules object removal and records an audit event.
Legal hold blocks deletion. Orphan cleanup reconciles missing metadata/objects without crossing
client boundaries. An upload incident triggers containment, access revocation, evidence
preservation, provider notification path, Product Owner escalation and a documented post-incident
review.
