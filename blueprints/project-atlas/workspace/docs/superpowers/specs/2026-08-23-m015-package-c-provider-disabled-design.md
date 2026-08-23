# M015 Package C Provider-Disabled Design

- Status: approved by Product Owner on 2026-08-23
- Scope: complete the first sensitive M015 slice without provider, deployment or real-data activation
- Decision model: conservative defaults authorized by the Product Owner's instruction to finish M015

## Goal

M015 becomes a purpose-bound, fail-closed profile capability rather than a guidance-only portal. The
first active contract is `home_buying_preparation`; it supports only self-reported monthly gross
income and recurring monthly debt for a preliminary, non-decisional DTI view. All other purpose
contracts remain available to owner modules but collect no fields until their own field policy is
enabled.

## Policy decisions

- PFL-001: only the two C1 financial amounts, USD currency and monthly cadence are permitted.
- PFL-002: `/client/profile` remains under Settings.
- PFL-003: client submissions are immutable proposals; no client write becomes verified/current.
- PFL-004: no staff mutation surface is enabled; future staff access is purpose-, assignment- and
  field-policy-bound.
- PFL-005/PFL-006: household, co-applicant, representative and organization data remain disabled.
- PFL-007/PFL-008/PFL-009: self-reported data is unverified, conflict-preserving and stale after
  30 days; missing/expired data never implies readiness.
- PFL-010: show concrete missing data, never a readiness percentage.
- PFL-011: DTI is deterministic integer-basis-point math, USD-only, preliminary and never an
  eligibility, lender or approval result.
- PFL-012: no full-value reveal/download or staff display surface is enabled.
- PFL-013: values require an application-envelope encryption adapter. The default adapter is
  unavailable and prevents persistence; no KMS credential is committed.
- PFL-014/PFL-015: export, deletion, legal hold and retention jobs remain disabled pending legal and
  operations activation; a deployed environment must configure retention before accepting values.
- PFL-016: C1 has a visible, versioned purpose acknowledgement; secondary use, partner sharing and
  AI are prohibited.
- PFL-017/PFL-018: document/OCR/provider and AI imports are disabled.
- PFL-019/PFL-020: external notifications and analytics/session replay are disabled.

## Architecture

The client submits a bounded encrypted proposal through the authenticated M007/M008 personal context.
The server validates exact fields, purpose acknowledgement, CSRF and origin. A data-protection port
encrypts the canonical proposal JSON before it reaches the profile repository. PostgreSQL stores only
ciphertext, key version, fact metadata, quality state and authorization/policy epochs. The repository
does not decrypt. A projection service decrypts only after the same personal-context and purpose
fences pass. If encryption, policy, context, epoch, purpose or feature flag is unavailable, the
operation fails closed.

## Out of scope

No real KMS, migration, deployment, Supabase activation, provider, document, OCR, AI, notification,
analytics, staff review UI, full-value reveal, export, household, business, tax, credit report,
lender decision, financing recommendation or automatic service start is included.

## Verification

Tests prove schema-free domain encryption boundaries, purpose allowlists, rejected cross-context
access, stale projection behavior, failed-closed protection, duplicate/idempotent submission and DTI
non-decisional semantics. Focused package typechecks, M015 tests, formatter, frozen lockfile and diff
checks are required before push.
