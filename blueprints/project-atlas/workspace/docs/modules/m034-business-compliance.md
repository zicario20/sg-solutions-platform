# M034 - Business Compliance

## Status

Technical controlled foundation implemented. It is not an operational filing, legal-advice, or
government-provider integration. No compliance obligation is presented as a legal conclusion when
the supporting requirement or organization profile is not current and verified.

## Architecture

`@atlas/business-compliance` is the bounded compliance vertical. It reuses Organization references,
M032/M033 handoff references, the existing document portal, task/approval boundaries, provider
registry conventions, and organization-management compliance projection. It does not create a
parallel organization master record, document store, task list, calendar authority, partner record,
or provider connection.

## Controlled capabilities

- Versioned Compliance Profiles and immutable evaluation snapshots retain source references.
- Requirements require an effective window, a verified source, freshness, version and structured
  deadline rule. Stale, unknown, inactive, or not-yet-effective requirements fail into review.
- Applicability is deterministic and returns uncertainty or professional review rather than a legal
  conclusion where the profile, activity, requirement, or jurisdiction is incomplete.
- Obligations have a deterministic uniqueness key, current source reference, period and reproducible
  deadline calculation trace. Unknown dates cannot become fabricated deadlines.
- Reminder plans are idempotent and intentionally contain no sensitive details.
- Periodic-report preparation binds requirement, report-data hash, authorization and immutable
  package. External filing is fail-closed behind a disabled provider and kill switch.
- Client-requested changes remain separate from verified official updates and need document evidence
  before they can affect master-data projections.
- Notices require source-document and official references; completions require evidence.
- Ownership-reporting evaluation is conditional and always requires professional review in this
  controlled implementation.
- Cross-module handoffs are deterministic, reference-only, contain no sensitive fields and cannot
  execute externally.
- Automation only permits low-risk task/reminder/read-model actions; AI suggestions are grounded,
  review-only and cannot declare compliance, file, override blockers or share partner data.
- Registered-agent continuity, license records, foreign qualifications, renewals and remediation
  have source-backed, non-executable maintenance contracts. Export, break-glass, partner sharing,
  incidents, requirement impact analysis and historical migration are explicitly governed.

## Persistence

`drizzle/0042_m034_business_compliance.sql` and
`packages/database/src/schema/business-compliance.ts` define the future PostgreSQL tables, forced
RLS and no-login gateway boundary. This migration was authored only; it has not run against any
database.

## Activation prerequisites

- Product Owner approval of service catalog, jurisdictions, source-review cadence, requirement
  publication policy, delivery models and service scopes.
- Current official-source mapping for each jurisdictional requirement, deadline, fee, form and
  ownership-reporting condition before publication.
- Security and legal/compliance review for field-level masking, document evidence, access purpose,
  exports, approvals, provider webhooks and high-risk filing controls.
- Staging validation for requirement impact analysis, calendar integration, task/notification
  adapters, provider reconciliation, unknown outcomes and fallback procedures.
- Approved partner capability/SLA/data-sharing controls and an operational runbook before any
  external submission is enabled.

## Explicit non-goals in this controlled build

- No automatic annual report, license, renewal, foreign-qualification, amendment, remediation or
  ownership-reporting filing.
- No hardcoded jurisdiction deadlines, fees, ownership-reporting rules, legal conclusions or
  government claims.
- No provider credentials, partner data sharing, real calendar notifications, payment activity,
  document-byte storage, migration execution or production deployment.
