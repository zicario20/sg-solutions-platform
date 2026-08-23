# M015 Profile Activation Decision Packet

- Status: Package B approved; Package C direction approved, PFL policy values pending
- Date: 2026-08-23
- Authority: M015 PRD, ADR 019 and the Product Owner

## Why a decision is required

The M015 provider-disabled foundation is safe because it stores no client profile data and exposes no
profile mutation. Enabling any real profile field changes data-collection, authorization, retention,
review and disclosure behavior. Those rules cannot be inferred from a UI or a technical default.

## Approval packages

### Package A - Keep the protected foundation

Keep M015 provider-disabled. The portal only explains the protected profile workflow. No profile
record, field, correction, staff access, import, document link, calculation or external notification
is activated.

This is the current state. It requires no PFL decision, but it does not deliver an editable profile.

### Package B - First low-risk client slice

Authorize only the self_service purpose for a client-owned goal and a correction proposal. The client
may submit a general goal and request a correction; nothing becomes verified or current without the
approved review policy. This package excludes legal name, date of birth, address, household, income,
expense, liability, asset, credit, tax, business, identifier, document and provider data.

Required decisions:

- PFL-001: exact goal fields, allowed values and required/optional status.
- PFL-002: confirm /client/profile remains under Settings for Release 1A.
- PFL-003: confirm that every client change is a proposal until a reviewer accepts it.
- PFL-010: use concrete missing-item language; do not show a percentage.
- PFL-016: approve the self-service collection/purpose copy and revocation behavior.
- PFL-019: keep notifications portal-only.
- PFL-020: keep analytics to zero-ID aggregate operational events, with session replay off.

## Recorded Package B approval

The Product Owner approved Package B on 2026-08-23. The implementation uses an active M007 personal
portal context as the narrowly scoped self-profile grant for this first slice. It stores only
allowlisted general goal codes and an acknowledgement of the displayed notice version. It does not
create a canonical consent record, contact, client, household, organization, document or financial
profile. M078 remains the future authority for reusable consent and revocation.

### Package C - Financial and business profile

Enable any personal, household, financial, tax, credit, housing or business profile section. This
requires the full applicable PFL set, the canonical M018/M019 relationship owners, M078 consent, M077
audit, approved KMS custody and purpose-specific Postgres RLS. It must be approved per service
purpose, not as a universal client-data collection flow.

The Product Owner approved proceeding to Package C on 2026-08-23. This records the architectural
direction only: it does not select a first service purpose, field inventory, KMS custody, retention,
staff access or any other PFL policy value. No sensitive collection, persistence, provider or runtime
activation is authorized until those values are separately recorded.

## Recorded C1 policy baseline

The Product Owner authorized Codex to finish M015 with conservative defaults on 2026-08-23. The
first sensitive slice is `home_buying_preparation` and accepts only self-reported monthly gross
income and recurring monthly debt in USD/monthly cadence. Submissions are immutable unverified
proposals, stale after 30 days, and never imply eligibility, lender approval or service start.

No household, organization, tax, credit-report, document, identity, provider, AI, notification,
analytics, export or full-value reveal is enabled. The default data protector is unavailable; all
financial submission fails closed until an approved KMS adapter, RLS migration, audit and retention
controls are operational.

## Decisions that remain mandatory before sensitive data

- PFL-004 through PFL-009: staff access, relationships, verification, conflict and freshness rules.
- PFL-011 through PFL-015: calculations, reauthentication, encryption, retention and export.
- PFL-017 through PFL-020: imports, AI, notifications and analytics.

## Recommended Product Owner response

Record one of the following exactly, then the next M015 implementation step can proceed:

- Approve Package A for M015.
- Approve Package B for M015 with the stated constraints.
- Approve Package C for M015 and provide the required PFL decisions.

No package activates a provider, payment, filing, credit decision, tax determination, financing
approval, document upload or external notification.
