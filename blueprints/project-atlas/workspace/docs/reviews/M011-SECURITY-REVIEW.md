# M011 Portal de documentos — Security Architecture Review

- Auditor: Cyber Neo, read-only
- Recorded by: Codex Architecture Agent
- Date: 2026-08-09
- Final status: `SECURITY-CLEAR for Product Owner documentary review`
- Final documentary risk: `0/100 — Secure`
- Open findings: 0 Critical, 0 High, 0 Medium, 0 Low
- Runtime/provider assurance: not assessed and not implied

## Scope

Cyber Neo reviewed the M011 PRD, responsive design, ADR 015 and synchronized cross-cutting
authorities for upload intent/finalization, TOCTOU, MIME/parser/malware handling, quarantine,
Storage/RLS/BOLA, signed URLs, preview isolation, immutable versions, context links, classification,
DTO privacy, OCR/AI/provider boundaries, telemetry, retention/hold/delete/restore, supply chain and
repository hygiene. The audit was read-only and changed no repository file.

## Finding closure

### CN-001 — Preview origin and sandbox boundary were ambiguous — Closed

The candidate now prohibits untrusted bytes in the authenticated application origin. Release 1A
requires a dedicated credentialless preview origin inside an opaque-origin iframe sandbox, never
combines `allow-scripts` with `allow-same-origin`, defines a restrictive minimum CSP and keeps
preview disabled unless the PDF/image viewer or rasterizer passes Build security tests.

### CN-002 — New bytes from processors/providers could bypass safety controls — Closed

Every conversion, OCR/redaction derivative, generated document and signature-provider return with
new bytes receives a new immutable locator/version, provenance, checksum, content-based MIME/parser
validation, scan under a versioned policy and independent promotion. Provider evidence, signature
metadata and a predecessor's clean verdict never substitute for the pipeline.

### CN-003 — Transversal upload controls were not synchronized — Closed

`FILE_UPLOAD_SECURITY.md` now requires unique no-overwrite capabilities or immutable seal/copy,
streaming byte enforcement, isolated nonprivileged parsers/scanners with no default egress,
independent output scanning and regression tests for replay, mutation, polyglots, active PDFs and
provider/content mismatch.

### CN-004 — Derived classification/visibility transitions lacked closed events — Closed

Link/unlink, replacement and reclassification now recompute the logical effective ceiling in the
same transaction from all retained governed versions and active purposes; unlink cannot create an
implicit downgrade. Logical visibility, selected client-visible version and context/version
visibility emit distinct post-commit events with CAS, epoch and audit evidence. Events grant no
access; the resource change and outbox fact commit in one Postgres transaction, then an at-least-
once dispatcher publishes after commit. Idempotent consumers tolerate duplicate/reordered delivery
and re-read authorized canonical Postgres state.

### CN-005 — Umbrella wording implied implemented Release 1A behavior — Closed

The Document Center header now states that Release 1A candidate scope is limited to secure core/
upload architecture and explicitly confirms that no behavior is implemented.

## Final security properties

- One actor/context/request-bound, expiring upload intent targets one opaque quarantine object and
  is finalized idempotently with a durable immutable receipt/version.
- Browser filenames and MIME are advisory; magic bytes, strict parsers, bounded resources,
  checksum and versioned malware evidence govern safety.
- Unknown, malicious, unsupported, failed or timed-out content never fails open. No human clean
  override exists.
- Domain authorization precedes object I/O; Client/Staff queries authorize before counts/cursors,
  and final fences protect every metadata/capability response.
- Context link/unlink validates both sides and canonical owner boundary with CAS, direct-deny,
  classification/assurance and epoch invalidation.
- Signed URLs are one-object, read-only and short-lived but are not falsely described as single-use
  or instantly revocable.
- Internal comments, bytes, filenames, object keys, OCR text, scanner/provider payloads and signed
  URLs remain outside analytics, telemetry, errors, AI history and shared/offline cache.
- Restore preserves safety/promotion/version/visibility/grant/retention/hold evidence and never
  promotes unknown content.

## Repository hygiene and supply chain

- Pre-report hygiene inspected the architecture candidate with no secrets,
  credentials, tokens, PII, client identifiers, private URLs, local absolute paths, media, binaries,
  conflict markers, whitespace problems or false implementation claims.
- It verified 115 local links with 0 broken and 21 PRD sections with 20 synchronized decisions.
- No manifest, dependency, lockfile or workspace configuration changed.
- `pnpm-lock.yaml` remained unchanged with SHA-256
  `C1ABFA94B76E87B197ED33EB53829EF0A73BFEA830880AD47A0E43C1A3E6A31A`.
- Cyber Neo's final review reported 0 findings, risk `0/100` and `git diff --check` PASS.

### Post-report revalidation

After adding both review reports, synchronizing state/history and aligning M008–M010 consumers to
the canonical M011 event vocabulary, the stable candidate contained 27 Markdown paths (22 tracked
modifications and 5 new files). Read-only revalidation found 128 Markdown references—123 resolved
local links and 5 external references—with 0 broken; 0 secret, credential, PII, private/local-path, conflict-marker or false-
implementation-claim hits; and `git diff --check` exit 0. No manifest, dependency, lockfile or
workspace configuration changed. The lockfile retained the SHA-256 above. This is documentary
evidence only and grants no Build, merge or operational status.

## Limitations and activation gates

`0/100` is a documentary assessment, not proof of runtime security. Build still requires Product
Owner decisions, accepted ADR/policies, provider and data-processing review, implemented domain/
RLS/Storage controls, malicious-file and concurrency tests, preview isolation evidence, restore
tests and independent review of actual code/configuration.

This report does not approve ADR 015, `GENERATE`, Build, external activation, merge, deployment or
production use. The Product Owner remains final authority.
