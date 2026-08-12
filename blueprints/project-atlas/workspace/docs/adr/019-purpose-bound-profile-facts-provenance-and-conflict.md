# ADR 019 — Purpose-bound profile facts, provenance, revision and conflict boundary

- Status: Proposed; Product Owner decision required before Build
- Owner: Codex Architecture Agent
- Final approver: Product Owner
- Date: 2026-08-12
- Scope: M015 and its boundaries with M007, M011, M017–M023, M027–M036, M077–M085
- Supersedes: none
- Related: ADR 004, ADR 005, ADR 006 and M015 Financial and Business Profile PRD

## Context

SG Solutions needs to reuse client-provided personal, household, financial and business context
across services without asking the same questions repeatedly. The same fact may arrive from a client,
staff member, document, provider, deterministic calculation or AI-assisted extraction. Sources can
disagree, expire or apply to different periods. Some facts—identity identifiers, tax/credit/banking
data, income, debt, assets and household information—are Highly Sensitive.

A single mutable client table would erase provenance and encourage broad access. A generic EAV/JSON
profile would weaken validation, referential integrity, reporting, encryption and migrations. Copying
facts into every service would create contradictory truths. Conversely, returning one full profile
to every specialist or AI agent would violate minimization and purpose limitation.

Project Atlas already separates identity, contact/client, organization, service order, case,
document, consent, audit and specialist-domain authorities. M015 must connect these authorities
without absorbing them.

## Decision proposed

### 1. M015 owns reusable facts, not canonical neighboring records

- M007/Supabase Auth owns identity and session proof.
- M017 owns Contact and CRM projection/pipeline data; M020 owns Lead and deduplication; M018 owns
  canonical Person/Household/Client records and relationship establishment.
- M019 owns the canonical Organization/business and its relationship establishment/validation.
- M021/M022 own ServiceOrder and CaseFile.
- M011 owns document metadata/versions/bytes and authorized delivery.
- M027/M030/M035/M036 and other specialist domains own detailed credit, tax, funding and housing
  case records.
- M077 owns audit evidence; M078 consent; M085 retention/legal hold.
- M015 owns reusable typed profile facts, immutable revisions, provenance, quality/freshness,
  conflicts, corrections and purpose-limited projections.

M015 references canonical opaque IDs/projections. It never creates a parallel contact, person,
household, client, organization, relationship, case or document. M015 household data is reusable
financial context over an M018-owned relationship projection; business data is a profile extension
to an M019 Organization/relationship projection, not another household/company registry.
M007 remains canonical for account preferred locale and IANA time zone; M026 owns notification
delivery preferences. M015 consumes current references for formatting and stores no conditional or
competing preference truth.

### 2. Use typed profile sections plus common governed metadata

Central facts use typed records with database constraints: purpose-bound personal/residence-history,
household financial context/reference, employment/income, expense/liability/asset, specialist
summaries, business extension/financial records and goals. M017/M018 retain canonical contact/
mailing/person attributes, and M018 retains household relationship establishment. Common metadata
supplies source, effective period, classification, quality, verification, freshness, consent/purpose
evidence, actor and immutable revision.

Common metadata does not justify one `key/value` or JSON blob. Approved extension fields require a
versioned definition containing type, validation, classification, purpose allowlist, copy and
migration plan.

Weak `ownerType/ownerId` or `profileType/profileId` references are rejected. A future schema uses
concrete foreign keys/typed association records that Drizzle/Postgres can enforce. Any generic
subject registry requires a separate accepted schema ADR proving referential and authorization
integrity.

### 3. Preserve immutable revisions and separate quality axes

Accepted facts are immutable revisions. A current pointer selects the revision applicable to a typed
field/subject/effective period. Updating creates a new revision and atomically changes the pointer
only after authorization, expected-version validation and policy acceptance.

Fact state is represented by orthogonal axes, not one exclusive enum:

- assertion/support: `unknown|self_reported|imported|document_supported`;
- verification: `not_verified|verified|unable_to_verify|verification_expired`;
- freshness: `not_evaluated|current|outdated`;
- dispute: `clear|disputed`;
- selection: `current|superseded`;
- disclosure projection: `full|masked|redacted`.

A fact can therefore be document-supported, outdated, disputed and masked simultaneously. Source
and support are separate from verification: a provider import is not verified merely because it came
from a provider; AI extraction is a suggestion. Verification workflow `verified` maps to fact
`verified`, `unable_to_verify|rejected` to fact `unable_to_verify`, and `expired` to fact
`verification_expired` plus freshness `outdated`. Pending workflow preserves the prior assessment;
when policy/source cannot assess freshness it remains `not_evaluated`, never `current`.
Verification records method, policy version, reviewer, evidence and expiry. Redaction is a response
projection, not stored fact quality.

Verified/document-supported facts cannot be silently overwritten. A material difference creates a
`ProfileConflict`, preserves both revisions and requires governed resolution. “Last write wins” is
prohibited for protected facts.

### 4. Make purpose an authorization input and projection contract

M015 access requires identity/session, permission, an M007-owned explicit profile or
ServiceOrder/CaseFile
relationship, approved purpose, consent where required, classification/assurance and resource/
access epochs. Role, email, phone, contact match, household/business relationship and payment are
insufficient.

M007 may issue an explicitly linked client a revocable self-profile grant. M015 consumes but cannot
create/revoke that grant. This does not change ADR 004: membership alone grants no case access. A
case grant permits only the approved purpose subset, not the full reusable profile. Household/co-
applicant and organization data require separate relationship/scope evaluation. M078 owns consent;
M015 owns a versioned purpose/field policy that grants no actor access.

Every consumer uses a distinct versioned DTO such as Basic, Credit, Tax, Home Buying, Business
Formation or Business Funding. There is no `FullClientProfileDto`. Authorization occurs before I/O;
Postgres RLS enforces compatible predicates, and every list/count/cursor/response plus final mutation
fence rechecks resource, purpose, consent, classification and epochs.

### 5. Treat forms, documents, providers and AI as proposal sources

Public/authenticated forms, M011/M065 document extraction, provider adapters and AI tools may call a
proposal-only port. They cannot write current protected facts, set verification status, establish
identity/business relationships or resolve conflicts.

Document evidence references an authorized M011 `DocumentVersion`; M015 stores no bytes, signed URL
or copied extraction payload. AI receives the minimum purpose DTO, never full identifiers, documents,
unrelated tax/credit facts or unrestricted history. All AI-derived data remains marked as suggested
with model/tool/version provenance until human/policy acceptance.

### 6. Keep calculations deterministic, preliminary and versioned

Income normalization, preliminary DTI, completeness and other approved calculations bind exact input
revision IDs, formula/version, unit/currency, rounding, timestamp and missing/quality indicators.
Unknown or stale inputs do not become zero. Results are labeled preliminary and cannot transition
service, payment, approval, entitlement or fulfillment state.

### 7. Protect Highly Sensitive values at the application boundary

Full SSN/ITIN/EIN, full DOB, approved government identifiers and banking identifiers use ADR 005
application-level envelope encryption before persistence. Masking occurs in server DTOs; full values
are not sent to ordinary clients or hidden with CSS. Decrypt/reveal is a separate purpose-bound,
step-up and audited operation if PFL-012 permits it.

Protected plaintext is prohibited from drafts, outbox, logs, traces, analytics, error reports,
caches, search, fixtures, support systems and ordinary AI context. Encryption/KMS failure rejects the
write or reveal; plaintext is never durably staged.

Any idempotency/comparison digest that covers protected or low-entropy profile values is a
server-derived, domain-separated keyed MAC with retained key version. Unkeyed hashes of SSN, DOB,
address or financial values are prohibited because they permit guessing. Digests are comparison
evidence only, never identity proof, access authority, deduplication grant or API output.

### 8. Keep durable state in Postgres and side effects owner-bound

One Postgres transaction commits accepted revision/current pointer, conflict/verification state,
idempotency receipt, audit reference and outbox. Inngest coordinates bounded jobs and retries only.
M023 owns tasks, M026 notifications, M077 audit and M011 export bytes. Consumers react through typed
idempotent handoffs and choose their own state transitions.

Every M015 access snapshot, draft/reveal/export capability and job binds a monotonic
`ProfileRecoveryEpoch` protected outside the database generation being restored. Recovery advances
the epoch and rejects every pre-restore artifact even if its nominal TTL remains valid. Protected
profile reads/writes stay fail-closed until M007 grant and M078 consent/revocation state are
reconciled from independently recoverable post-checkpoint evidence or explicitly reauthorized/
reissued. The restored snapshot cannot validate itself. Derived completeness/cache/evidence is then
rebuilt and old capabilities/jobs are purged or reissued under the new epoch.

### 9. Gate the field inventory and every external/secondary use

Release 1A implements only a Product Owner-approved field/purpose inventory for the first real-client
service slice. PFL-001–PFL-020 govern route, field edits, access, relationships, verification,
freshness, calculations, encryption, retention, export, consent, imports, AI, notifications and
analytics. Architecture completion does not activate any field, provider, AI, partner sharing or
product behavior.

## Consequences

### Positive

- Reusable context remains consistent without duplicating specialist cases.
- Provenance and immutable revision make disagreement, correction and audit explicit.
- Purpose-specific DTOs and grants sharply reduce disclosure and AI overexposure.
- Release 1A can start narrow and extend compatibly through typed records/policies.
- Deterministic calculations and explicit quality prevent false approval claims.

### Costs

- More policy/version/metadata and review workflows than a mutable profile form.
- Exact field/purpose inventories, RLS rules, KMS/key custody and retention need Product Owner and
  security/legal decisions before Build.
- Encrypted fields limit search/indexing and complicate recovery/rotation.
- Services must maintain versioned projection contracts instead of querying profile tables directly.

## Alternatives rejected

### One large client/profile table

Rejected because it mixes concerns, creates broad access, cannot represent conflicting periods and
encourages nullable/sensitive overcollection.

### JSON or EAV for all fields

Rejected because it weakens constraints, validation, encryption selection, reporting, migration and
RLS review. Controlled versioned extension fields may exist only for approved edge cases.

### Copy profile data into every service

Rejected because reusable truth diverges. A specialist case may retain an immutable evidentiary
snapshot when its PRD requires it, with explicit source/version—not an untracked duplicate.

### Latest value wins

Rejected because source authority, effective period and verification matter; it could replace a
verified fact with an unreviewed form or AI suggestion.

### Role-only access

Rejected because staff roles are broad and cannot express client/case relationship, purpose,
consent, household/business boundaries or sensitivity.

### Full-profile API with UI filtering

Rejected because hidden fields still leave the server, expand breach impact and invite accidental
cross-purpose consumption.

### Direct provider/AI writes

Rejected because external outputs are not SG verified truth and can be stale, incorrect,
over-collected or unauthorized.

## Validation required before acceptance/Build

- Product Owner closes affected PFL decisions and approves the first field/purpose inventory.
- Data/security review proves typed constraints, immutable revisions and no weak generic owner link.
- Authorization tests cover client/business/household/case isolation, purpose, revocation, RLS and
  final-fence races, prove M015 cannot grant/revoke access, and prove a snapshot predating revocation
  fails after `ProfileRecoveryEpoch` advances.
- DTO contract tests prove each consumer receives only its allowlist and no full-profile route exists.
- Cryptographic tests prove plaintext absence and fail-closed KMS behavior.
- Data-quality tests prove conflicts, stale facts, units/currency/periods and deterministic formulas.
- Ownership tests prove only M018/M019 establish Person/Household/Organization relationships and
  M015 cannot create, link, revoke or reinterpret them outside an approved purpose projection.
- UX/a11y tests prove masking, correction, unknown/zero separation and ES/EN semantic parity.
- Backup/restore tests prove encrypted data recovery, derived-view rebuild and capability invalidation.
- Independent security review and Product Owner Build authorization are recorded.
