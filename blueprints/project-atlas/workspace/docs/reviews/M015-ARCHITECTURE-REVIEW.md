# M015 Financial and Business Profile — Independent Architecture Review

- Reviewer: independent review agent; did not author the candidate
- Recorded by: Codex Architecture Agent
- Date: 2026-08-12
- Base commit: `57254ea75ae09ac00c152efa8d381e85be250ca2`
- Final verdict: `APPROVED for Product Owner documentary review`
- Open material findings: 0
- Runtime/provider assurance: not assessed and not implied

## Scope

The reviewer inspected the complete normalized M015 candidate: its 21-section PRD, responsive
Client/Admin design, proposed ADR 019, twenty `PFL-001`–`PFL-020` gates and synchronized API,
architecture, database, classification, encryption, recovery, activation, roadmap, catalog and
consumer documentation. The review was read-only.

M015 is one purpose-bound reusable profile-fact context. It is not a second CRM, Client/Household,
Organization, Case, Document or specialist-service store. It does not infer eligibility, establish
relationships or grant access.

## Finding closure

### IA-001 — Fact status collapsed incompatible meanings — Closed

Assertion support, verification, freshness, dispute, current selection and disclosure are separate
orthogonal axes. Verification workflows map explicitly to those axes, including a
`not_evaluated` freshness value, and future tests must cover their Cartesian combinations.

### IA-002 — Canonical owner boundaries were inconsistent — Closed

M007 owns identity/session/profile grants and account locale/time zone; M017 owns Contact/CRM;
M020 owns Lead/deduplication; M018 owns Person/Household/Client and their relationships; M019 owns
Organization/business relationships; M021/M022 own ServiceOrder/CaseFile; M011 owns document bytes
and evidence delivery; M026 owns notification preferences. M015 consumes typed, reauthorized
projections and cannot mutate those authorities.

### IA-003 — Authorization inheritance could expose unrelated resources — Closed

Every operation requires identity/session and exact permission plus either an explicit M007
ProfileGrant or an exact assigned/granted ServiceOrder/CaseFile relationship, then purpose/consent,
classification/audience, assurance and current access/recovery fences. Household/business scope is
conditional on the corresponding M018/M019 relation; it is not required for the subject's own
profile. Email, contact, membership, payment and relationship evidence alone grant nothing.

### IA-004 — Stale authorization fallback could reveal data — Closed

When purpose policy, authorization or the final fence is unavailable or fails, the response contains
no protected value, count, draft, cache entry or actionable control. A previously confirmed value
cannot be rendered as a fallback.

### IA-005 — Digest design was unsuitable for low-entropy identifiers — Closed

Comparison evidence uses a server-derived, domain-separated keyed MAC, never a raw, unkeyed or
client-supplied digest. MAC keys are separated from encryption, blind-index and signing keys,
versioned, rotated, kept outside database/backups and reconciled manually/fail-closed when lost.

### IA-006 — Relationship, address and preference authority drifted — Closed

M015 household and business context uses opaque M018/M019 projections. M015 residence history is
purpose-specific and cannot become the canonical contact/mailing address. Account locale/time zone
remain M007 facts and notification preferences remain M026 facts. Generic ownership-percentage
policy was removed from M015 and remains gated with M019 under PFL-006.

### IA-007 — Event and contract naming lacked one wire authority — Closed

The exact external wire namespace is `profile.*`. PascalCase names may exist internally only with a
documented one-to-one mapping. Consumers receive minimal versioned service-specific DTOs; a
`FullClientProfile` contract is prohibited.

### IA-008 — Restore could resurrect revoked profile access — Closed

A monotonic external `ProfileRecoveryEpoch` binds authorization snapshots, grants/consent evidence,
drafts, reveal/export capabilities and jobs. Restore cutover rejects every prior epoch and blocks
protected operations until M007/M078 state is reconciled from evidence outside the restored snapshot
or explicitly reauthorized/reissued. Restore-before-revocation is a mandatory future test.

### IA-009 — Security wording assigned relationship mutation to M015 — Closed

`SECURITY.md` now says explicitly that M015 cannot mutate household/business relationships and only
consumes reauthorized M018/M019 projections. It also clarifies that complete protected values are
not sent to ordinary browsers or hidden merely with CSS.

### IA-010 — Final review-report links were unresolved — Closed

The real architecture and Cyber Neo reports are persisted under `docs/reviews/` with the reviewed
base, scope, finding closure, verdict and limitations. They are not placeholder approvals.

## Final architecture properties

- Typed facts retain immutable revisions, provenance and independent quality axes; corrections and
  conflicts do not overwrite verified history or use last-write-wins.
- Forms, M011 evidence, providers, imports and AI can propose values only. Authorized human/domain
  policy decides verification, selection and conflict resolution.
- Every consumer receives only the fields and disclosure level required for one approved purpose;
  unrestricted profile DTOs, bulk reveal and eligibility side effects are rejected.
- Protected identifiers use ADR 005 application-level encryption and backend masking/reveal
  boundaries. Deterministic calculations are preliminary, versioned and cannot imply approval.
- Postgres owns durable operational state; Supabase Auth supplies identity; domain services plus RLS
  enforce authorization; Inngest may coordinate but never owns fact or workflow truth.
- Twenty unresolved policies remain one-to-one `PFL-001`–`PFL-020` Product Owner decisions.

## Verification snapshot

The substantive independent pass reported zero remaining material architecture/security findings and
identified only the missing persisted reports. After both real reports were added, candidate-local
link, whitespace and authority checks were rerun as part of final validation. Cyber Neo's final
post-remediation pass reported zero Critical, High, Medium or Low findings and documentary risk
`0/100`.

## Limitations

The supplied M001–M021 source is an external attachment and is not preserved as an immutable
repository artifact. The reviewer therefore audited the normalized M015 candidate against current
repository authorities but could not independently prove one-to-one completeness against that raw
source.

This review validates documents, not routes, schema/RLS, keys, providers, real profile data,
concurrent runtime behavior, browser accessibility or restoration. Those properties require
Product Owner decisions, acceptance of ADR 019, explicit `GENERATE` plus a Build gate,
implementation and independent runtime review. This report does not authorize merge, deployment or
production use.
