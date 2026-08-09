# ADR 015 — Document authority, quarantine, version and delivery boundary

- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Status: Proposed; no Build authority
- Date: 2026-08-09
- Extends: ADRs 003–005 and proposed ADRs 011–014; does not supersede them
- Update rule: accept or supersede only after independent security review and Product Owner approval

## Context

M011 must accept untrusted client bytes while protecting Highly Sensitive tax, credit, identity,
banking and business evidence. A naive upload feature can make object existence equal authorization,
promote malware after scanner failure, overwrite evidence, leak another client's duplicate/file
metadata, expose long-lived signed URLs, treat clean bytes as business approval, or allow a
retention restore to resurrect unsafe content.

The Product Owner's source mentions MinIO and `/account`, but the accepted Project Atlas baseline is
Supabase private Storage and `/client`. The architecture must preserve provider abstraction without
silently replacing the approved stack or creating a second document store.

## Decision proposed

### 1. One document domain owns meaning; Storage owns only private bytes

Postgres/domain services are the operational authority for `DocumentRequest`, `Document`, immutable
`DocumentVersion`, context links, safety/promotion/review state, visibility and document
disposition/hold state with an M085 retention-policy reference. M011 emits M077 `AuditEvent`
evidence; it owns no parallel audit or retention-policy authority.
Supabase private Storage is the Release 1 byte store under ADR 003. Storage object existence,
bucket/prefix or signed URL is never domain state or authorization.

`StorageProvider` isolates domain contracts from provider paths. This permits a future accepted ADR
and migration to another compatible provider, but does not authorize MinIO/S3/self-hosting now.
Sanity never stores private metadata, object references or client content.

### 2. Upload safety, operational review, visibility and disposition are separate axes

The model never uses one overloaded `document.status`. At minimum it preserves:

- upload-intent/receipt state;
- content validation and malware safety verdict;
- quarantine-to-private promotion state;
- operational review/request state;
- client/internal/external visibility;
- immutable version lineage/current pointers;
- lifecycle, retention and orthogonal legal hold.

Only a safety-clean, checksum-verified version may promote. Promotion does not mean staff acceptance,
request satisfaction, client visibility, authenticity or legal sufficiency. Upload receipt does not
complete a task. Legal hold denies prohibited disposition but grants no read.

### 3. Every inbound byte follows one fail-closed lifecycle

```text
authorize exact upload intent
→ upload exact object to private quarantine
→ finalize durable receipt and reserve immutable quarantined version/audit evidence
→ validate actual size, content type and strict parser
→ calculate SHA-256
→ scan under a versioned scanner policy
→ reject or promote with checksum/inventory reconciliation
→ compare-and-set approved pointers and emit transition audit evidence
→ permit separately authorized review/preview/download
```

The intent binds actor/session/context/request, object, allowed types/limits, expiry, policy version
and one-use correlation. Client/provider metadata is advisory. Unknown, ambiguous, encrypted,
unsupported, malformed, malicious, failed or timed-out results remain quarantined/rejected; no
normal worker or staff UI can override them to clean. Recovery may rescan the exact hash under an
approved policy, use another approved controlled scan that creates valid evidence, replace the
bytes or delete them. Any future risk acceptance requires a separate ADR/Product Owner/security
gate and cannot falsify the safety verdict or authorize promotion.

The provider/gateway compatibility proof must enforce a unique no-overwrite target and bounded
bytes, and must show that token retry/reuse cannot mutate a finalized or scanned object. If the
provider cannot guarantee that property, the design must seal/copy the exact upload to a new
immutable quarantine locator before validation/scanning and reconcile checksum/provider generation
at every transition. Parsers and scanners run in resource-bounded nonprivileged isolation with no
default egress or unrelated-object access.

### 4. Explicit grants and final fences protect metadata and bytes

M007 membership is necessary but insufficient. A request requires an explicit active case/service
or direct document grant. ADR 004 inheritance applies only to an ordinary linked `client_visible`
resource. Internal/compliance/draft, inheritance-blocked or explicitly denied content never inherits;
designated Highly Sensitive categories require the approved extra grant/assurance policy.

Domain authorization runs before object I/O. Restricted Postgres RLS and private Storage policies
enforce the same scope; user-facing reads never use `service_role`, owner or `BYPASSRLS`. Every
list/detail/cursor/upload-finalize/replacement/preview/download/review/classify/reclassify/
visibility/client-visible-version/context-link/share/disposition command reauthorizes. Immediately
before returning metadata or a storage capability, a final fence rechecks session/context/grant,
parent links, visibility, classification/assurance, lifecycle/hold and resource/version epochs. A
mismatch returns no body, count, cursor, timing distinction, key or capability. Exposure-changing
mutations use compare-and-set, advance the authorization epoch and emit minimized audit/outbox
evidence; context link/unlink authorizes both the document and target context.

### 5. Logical documents and immutable versions prevent overwrite

One logical `Document` groups immutable versions. Replacement always creates a new quarantine
object/version and advances each approved current pointer with compare-and-set only after safety and
owning review criteria. Prior bytes/hash/source/review remain immutable and governed by retention.
Each version records an effective classification, policy version and bounded evidence; the logical
document retains a default and effective ceiling across retained versions/linked purposes. New,
replacement and derived versions begin at the maximum applicable document/link/source class.
Reclassification targets document or version explicitly; a downgrade needs exact authority,
evidence, CAS, epoch invalidation and audit/outbox, and otherwise fails closed at the higher class.
Link/unlink, replacement and reclassification recompute the logical document effective ceiling in
the same transaction from every retained governed version and active linked purpose. Unlink alone
cannot lower it; any decrease needs complete evidence and explicit reclassification, with no
intermediate lower-class window.

Explicit `DocumentContextLink` records may associate one document with multiple authorized
ServiceOrder/Case/request/task contexts without copying bytes. Each link authorizes independently;
it cannot reveal other links, transfer a grant, lower classification/visibility or bypass a direct
deny merely by existing. Any new audience derives only from the approved target link and that
target's current grants/visibility/classification/assurance, with CAS, epoch invalidation and audit.
Logical-document visibility, selected client-visible-version and context-link/version visibility
emit distinct post-commit outbox facts. Consumers re-read canonical Postgres; an event is never an
access grant or independent state authority.
Release 1A links remain within one canonical client/data-owner boundary; cross-client, household or
business-boundary reuse is disabled until DOC-010 approval. Cross-client physical deduplication is
not exposed or relied on in Release 1.

Promotion and quarantine-object disposition are separate durable axes. Deleting the quarantine
source after successful promotion cannot erase the `promoted` state, while a retained or
deletion-failed source grants no access; reconciliation proves both independently.

### 6. Inngest coordinates jobs; Postgres/outbox remains durable authority

Validation, scanning, promotion, intent/quarantine expiry, inventory reconciliation, retention and
purge are idempotent, expected-version transitions driven from Postgres/outbox evidence. Each job
has a stable resource/version/policy idempotency key, bounded retries/backoff and a manual recovery
task after exhaustion. Inngest may coordinate execution but cannot declare bytes clean, accepted,
visible or deleted independently.

Promotion is a recoverable multi-system workflow. Until Postgres metadata, accepted-tier object,
checksum and quarantine disposition reconcile, the version is `promotion_uncertain` and unavailable.
Object/metadata mismatch never guesses the favorable state.

### 7. Preview/download capabilities are bounded handoffs, not authority

Every preview/download performs fresh domain/RLS authorization and final fencing. A resulting URL is
one-object, read-only and short-lived within ADR 003; it is never stored in Postgres, logs,
analytics, HTML cache or offline storage. Because a provider-signed URL may remain reusable until
expiry, the UI and audit must not claim single use or instant revocation unless a future proxy/token
control proves it.

Audit distinguishes authorization issuance from provider-observed delivery. Preview never renders
untrusted bytes in the authenticated application origin: Release 1A uses a dedicated credentialless
preview origin inside an opaque-origin iframe sandbox, never combines `allow-scripts` with
`allow-same-origin`, and applies at least `default-src 'none'; object-src 'none'; base-uri 'none';
form-action 'none'; connect-src 'none'`. HTML/SVG/active content is never rendered; the PDF/image
viewer or rasterizer requires Build security evidence or preview remains disabled. Safe content
type, nosniff and Content-Disposition/filename encoding are mandatory. Bulk export is separately
gated.

### 8. M011 owns the secure core; M065, M066 and M067 remain separate owners

- M011: requests, uploads, safety/promotion, metadata, versioning, review, visibility and delivery.
- M065: OCR, extraction, classification/quality suggestions and redaction processing.
- M066: versioned generated-document templates/drafts and approval evidence.
- M067: signer workflow, provider evidence and immutable signed artifact.
- M023: task state; M011 emits facts but does not auto-complete tasks without the owning rule.
- M077/M085/M098: audit, retention/deletion and recovery authorities.

Future processors receive a narrow authorized version and minimum content only after safety
promotion. They cannot access a bucket or mutate M011 authority outside typed commands.
Every processor/generator/signature-provider result containing new bytes returns through the M011
immutable provenance/checksum, content/parser validation, versioned scan and promotion lifecycle.
Provider signature/evidence and a predecessor's clean verdict cannot substitute for those controls.

### 9. Retention, deletion and restore preserve version and safety evidence

Disposition uses a versioned approved policy. Legal hold and required evidence block destructive
actions but never grant access. Deletion tombstones/revokes first, removes eligible objects through
an idempotent job, reconciles inventory and records minimized evidence. Backup expiration follows
the approved schedule; no document claims immediate purge from already protected backups.

A restore begins in isolation and reconciles Postgres state, object inventory, checksum, tier,
safety verdict, version lineage, visibility and grants before cutover. Quarantined, unknown or
mismatched content remains unavailable.

### 10. External/channel ingestion and providers remain activation gates

M004/M012/email/partner/public-link ingestion, malware scanner, M065 processors, M067 signatures
and external shares require their own Product Owner policy/provider/data-processing decisions.
When activated, every inbound file uses the same intent/quarantine/safety pipeline; no channel keeps
authoritative bytes or bypasses classification. The safe default is reject or direct the actor to
the authenticated portal.

## Consequences

- The model is more explicit than a single upload table but prevents security, review and lifecycle
  facts from overwriting each other.
- Normal client-visible case documents can inherit access without grant sprawl; internal and
  designated Highly Sensitive documents remain fail-closed.
- Direct-to-Storage upload reduces application byte handling while keeping domain authorization and
  finalization server-controlled.
- Short signed URLs bound but do not eliminate revocation exposure; exact lifetime and stronger
  proxy behavior remain Product Owner decisions.
- Version preservation and recovery increase storage/retention complexity and require reconciliation
  tests before production.
- Release 1A remains narrow and manual where optional processors/providers are unavailable.

## Rejected alternatives

- **MinIO in parallel with Supabase Storage:** violates the approved baseline and creates two byte
  authorities without a migration requirement.
- **One mutable document row/object:** loses evidence and permits silent overwrite/races.
- **One `status` column:** conflates scan, review, visibility, lifecycle and hold.
- **Public or long-lived object URLs:** leak capabilities and bypass current resource authorization.
- **Client bucket access/listing:** makes provider paths a security boundary and increases BOLA risk.
- **Scanning after accepted storage:** exposes untrusted bytes to normal workflows too early.
- **Fail-open scanner outage/manual clean toggle:** converts infrastructure failure into compromise.
- **Cross-client deduplication signal:** leaks that another client owns identical content.
- **OCR/AI as automatic truth:** can corrupt case data and exceed consent/purpose boundaries.
- **Per-service document tables:** duplicates primitives and fragments retention/audit/security.

## Verification required before acceptance/Build

- Product Owner resolves DOC-001–DOC-020 applicable to Release 1A and accepts or revises this ADR.
- Security review covers BOLA, Storage/RLS parity, signed URL leakage, parser/scan bypass, promotion
  uncertainty, version races, cross-client dedupe, preview injection, retention and restore.
- Provider compatibility proves private quarantine/accepted isolation, bounded upload/read
  capabilities, object inventory/version behavior and policy-as-code deployment.
- Tests cover revocation during upload/finalize/preview/download, cross-context links, resource
  reparenting, classification/visibility/hold changes and no-existence leakage.
- Operations runbooks cover scanner outage, malicious object, orphan/mismatch, storage outage,
  accidental access, restore and authorized purge.

This proposed ADR does not authorize implementation, provider activation, real files, merge,
deployment or production use.
